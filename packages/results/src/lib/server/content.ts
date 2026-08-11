// Joins the content sheet ($content/survey.json, written by scripts/gsheet.js)
// to the response data ($data/<chapter>.json), matched on dataId.
import survey from '$content/survey.json'
import methodology from '$data/methodology.json'
import { getQuestionDefinition } from './questions'

const datasets: Record<string, any> = Object.fromEntries(
	Object.entries(import.meta.glob('$data/*.json', { eager: true, import: 'default' }) as Record<string, any>).map(([path, json]) => [
		path
			.split('/')
			.pop()!
			.replace(/\.json$/, ''),
		json,
	])
)

const getChapterById = new Map<string, any>(survey.chapters.map((chapter: any) => [chapter.id, chapter]))

// A chapter trimmed to what the nav and page headers need.
const summary = ({ id, name, index, description, descriptionLong }: any) => ({ id, name, index, description, descriptionLong })

// Thrown, not rendered: a note in the layout is easy to scroll past and ships.
function fail(message: string): never {
	throw new Error(`content: ${message}`)
}

// A lookup the page can't render without, failed with the caller's context.
function required(resolved: any, context: string) {
	if ('error' in resolved) fail(`${context}: ${resolved.error}`)
	return resolved
}

const completions = (methodology as Record<string, any>).TotalRespondents

// A count as a share of all completions, or null if either number is missing.
const shareOfSurvey = (n: unknown) => (typeof n === 'number' && typeof completions === 'number' && completions ? n / completions : null)

// `response -> short` for the strings this figure draws, from the question's options.
function shortsFor(definition: any, data: any[], metadata: any) {
	const asked: Record<string, string> = {}
	for (const option of definition?.options ?? []) if (option?.short) asked[option.label] = option.short

	const shorts: Record<string, string> = {}

	const add = (value: unknown) => {
		if (typeof value === 'string' && asked[value]) shorts[value] = asked[value]
	}

	for (const row of data) add(row?.response)
	// Segment labels are a bare array on a stacked bar and `labels` on a sankey.
	for (const label of (Array.isArray(metadata) ? metadata : metadata?.labels) ?? []) add(label)

	return shorts
}

// One question cut by one demographic, ready to draw.
function demographic(chapterId: string, dataId: string, key?: string) {
	const question = datasets[chapterId]?.[dataId]
	if (!question) return { error: `no question "${dataId}" in ${chapterId}.json` }

	const keys = Object.keys(question.datasets ?? {})
	const id = key || keys[0]
	const found = question.datasets?.[id]
	if (!found) return { error: `"${dataId}" has no demographic "${id}" — has ${keys.join(', ')}` }

	const definition = getQuestionDefinition(question.qname)

	return {
		dataId,
		question: question.question,
		definition,
		demographic: { id, name: found.name, n: found.total_respondents, share: shareOfSurvey(found.total_respondents) },
		chart: found.plot_type ?? null,
		subtext: found.plot_subtext ?? null,
		metadata: found.plot_metadata ?? null,
		data: found.data ?? [],
		shorts: shortsFor(definition, found.data ?? [], found.plot_metadata),
	}
}

// The section and slug a question sits at, or nulls if it isn't in one.
function placeOf(chapter: any, dataId: string) {
	for (const section of chapter.sections ?? []) {
		const question = (section.questions ?? []).find((q: any) => q.dataId === dataId)
		if (question) return { section: section.name, slug: question.dataIdSlug }
	}

	return { section: null, slug: null }
}

// A figure the sheet promoted, with its copy and the rows it asked for.
function feature(chapter: any, ref: any) {
	if (ref.chart === 'quote') return { kind: 'quote', chart: 'quote', headline: ref.headline, description: ref.description }

	const resolved = required(demographic(chapter.id, ref.dataId, ref.dataset?.[0]), `${ref.tier} "${ref.headline}"`)

	let data = resolved.data

	// Responses get reworded between years, and the figure would render empty.
	const missing = (ref.values ?? []).filter((v: string) => !data.some((r: any) => r.response === v))
	if (missing.length) fail(`${ref.tier} "${ref.headline}": no row ${missing.map((m: string) => `"${m}"`).join(', ')}`)

	if (ref.values?.length) data = ref.values.map((v: string) => data.find((r: any) => r.response === v))
	if (ref.limit) data = data.slice(0, Number(ref.limit))

	return {
		kind: 'figure',
		...resolved,
		chart: ref.chart,
		headline: ref.headline,
		description: ref.description,
		...placeOf(chapter, ref.dataId),
		data,
	}
}

// Every figure a chapter promoted at one tier.
const features = (chapter: any, tier: string) =>
	(chapter.features ?? []).filter((f: any) => f.tier === tier).map((f: any) => feature(chapter, f))

// A chapter's questions flattened out of their sections, so neighbours are findable.
const questionIndex = (chapterId: string): any[] =>
	(getChapterById.get(chapterId)?.sections ?? []).flatMap((section: any) =>
		(section.questions ?? []).map((q: any) => ({ ...q, sectionId: section.id, sectionName: section.name }))
	)

// The chapters either side, in reading order, wrapping at both ends.
function neighbours(id: string) {
	const at = survey.chapters.findIndex((c: any) => c.id === id)
	const wrap = (i: number) => summary(survey.chapters[(i + survey.chapters.length) % survey.chapters.length])

	return { previous: wrap(at - 1), next: wrap(at + 1) }
}

export const settings = survey.settings

// Chapter summaries for the nav, sitemap and prerender entries — no figures resolved.
export const listChapters = () => survey.chapters.map(summary)

// Every chapter with its hero figures, for the front page.
export const getChapters = () => survey.chapters.map((chapter: any) => ({ ...summary(chapter), heroes: features(chapter, 'hero') }))

// One chapter with its highlight figures and its neighbours.
export function getChapter(id: string) {
	const chapter = getChapterById.get(id)

	if (!chapter) return null

	return { ...summary(chapter), highlights: features(chapter, 'highlight'), ...neighbours(id) }
}

// Slug and name for each question in a chapter.
export const listQuestions = (chapterId: string) =>
	questionIndex(chapterId).map(({ dataIdSlug, name }: any) => ({ slug: dataIdSlug, name }))

// Every demographic a question was cut by, skipping the ones that failed to resolve.
const allDemographics = (chapterId: string, dataId: string) =>
	Object.keys(datasets[chapterId]?.[dataId]?.datasets ?? {})
		.map((key) => demographic(chapterId, dataId, key))
		.filter((d: any) => !('error' in d))

// One question page: every demographic inline, so switching needs no round trip.
export function getQuestion(chapterId: string, slug: string) {
	const chapter = getChapterById.get(chapterId)
	if (!chapter) return null

	const questions = questionIndex(chapterId)
	const index = questions.findIndex((q: any) => q.dataIdSlug === slug)
	if (index === -1) return null

	const q = questions[index]
	const demographics = allDemographics(chapterId, q.dataId)

	if (!demographics.length) fail(`question "${q.name}": no demographics for "${q.dataId}"`)

	const sibling = (i: number) => (questions[i] ? { slug: questions[i].dataIdSlug, name: questions[i].name } : null)

	return {
		kind: 'figure',
		...q,
		...demographics[0],
		id: q.dataIdSlug,
		demographics,
		previous: sibling(index - 1),
		next: sibling(index + 1),
	}
}

// A chapter's full data page; `groups` is opt-in because it triples the payload.
export function getChapterData(id: string, { groups = false } = {}) {
	const chapter = getChapterById.get(id)

	if (!chapter) return null

	return {
		...summary(chapter),
		sections: (chapter.sections ?? []).map((section: any) => ({
			...section,
			questions: (section.questions ?? []).map((q: any) => ({
				kind: 'figure',
				...q,
				...required(demographic(id, q.dataId), `question "${q.name}"`),
				id: q.dataIdSlug,
				...(groups ? { demographics: allDemographics(id, q.dataId) } : {}),
			})),
		})),
		...neighbours(id),
	}
}
