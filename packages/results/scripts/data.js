// Bakes the content sheet, the survey export and the question bank into one file
// per route payload under src/generated. A route's `load` then returns its file.
//
// Runs from `npm run data`, and from the Vite plugin in vite.config.js on every
// dev start and build — so it can't be forgotten.
//
// One file on purpose: it is a single pass with no branching, and reading it top
// to bottom is the documentation for what the payloads contain.

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { kebabCase } from 'lodash-es'
import { marked } from 'marked'
import YAML from 'yaml'

import { graphsFor } from '../src/lib/jsonld.ts'
import { STRUCTURAL, labelFor } from '../src/lib/labels.ts'

marked.use({ breaks: true, gfm: true })

// Sheet and question-bank copy is markdown. Rendering it here rather than in a
// component keeps `marked` — 47 KB, 15 KB gzipped — out of the client bundle.
// The plain text stays alongside for meta tags, the sitemap and llms.txt.
//
// A single line with no list marker is a fragment, so it renders without the
// wrapping <p> that would break it out of the sentence it sits in.
function html(md) {
	if (typeof md !== 'string' || md === '') return ''

	const inline = !md.includes('\n') && !/^\s*[-*]\s/m.test(md)
	return String(inline ? marked.parseInline(md) : marked.parse(md)).trim()
}

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO = path.resolve(APP, '../..')
const OUT = path.join(APP, 'src/generated')

const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'))

// Earlier years, for the DataCatalog on the home page.
const readYears = () => readJson(path.resolve(APP, '../archive/index.json'))

// --- inputs ------------------------------------------------------------------

async function readInputs() {
	const dataDir = path.join(APP, 'src/data')
	const files = (await fs.readdir(dataDir)).filter((f) => f.endsWith('.json'))

	const data = Object.fromEntries(
		await Promise.all(files.map(async (f) => [f.replace(/\.json$/, ''), await readJson(path.join(dataDir, f))]))
	)

	// The question bank, keyed by id, with the repo-relative path a page links to.
	const bank = {}
	const groups = await fs.readdir(path.join(REPO, 'questions'), { withFileTypes: true })

	for (const group of groups.filter((e) => e.isDirectory())) {
		for (const file of (await fs.readdir(path.join(REPO, 'questions', group.name))).filter((f) => f.endsWith('.yaml'))) {
			const source = `questions/${group.name}/${file}`
			const doc = YAML.parse(await fs.readFile(path.join(REPO, 'questions', group.name, file), 'utf8'))
			if (doc?.question?.id) bank[doc.question.id] = { ...doc.question, titleHtml: html(doc.question.title), source }
		}
	}

	const survey = await readJson(path.join(APP, 'src/content/survey.json'))

	// The scalars the methodology page prints, carried in the payload so no module
	// outside this file imports from $data.
	const methodology = Object.fromEntries(Object.entries(data.methodology ?? {}).filter(([, v]) => typeof v !== 'object'))

	return { survey, data, bank, methodology }
}

// --- figures -----------------------------------------------------------------

// A bare reference, for the places that only link to a chapter: the prev/next
// cards and the chapter a question belongs to. Carrying the full summary there
// shipped a lorem paragraph and its HTML into all 28 question payloads.
const ref = ({ id, name, index }) => ({ id, name, index })

// The full header copy, for the page that draws the chapter itself.
const summary = ({ id, name, index, description, descriptionLong }) => ({
	id,
	name,
	index,
	description,
	descriptionHtml: html(description),
	descriptionLong,
	descriptionLongHtml: html(descriptionLong),
})

// A chapter is drawable once its export has been regenerated. The legacy shape
// nests cuts under `datasets`; the tidy one declares them up front.
const isTidy = (question) => Array.isArray(question?.meta?.slices)

const valueKeys = (rows) => [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !STRUCTURAL.has(key))))]

// A bar draws the share. Where the rows carry none — the salary questions — it
// draws the first named column instead.
const valueFor = (rows) => {
	if (rows.some((row) => typeof row.pct === 'number')) return null
	const [first] = valueKeys(rows)
	return first ? labelFor(first) : null
}

// A scatter needs two, and which is which the data can't say. The convention:
// the explanatory column on x, the money on y. Right for the only scatter in the
// survey, and wrong the day a currency column stops ending in `_usd` — so the run
// prints what it resolved.
const axesFor = (rows) => {
	const keys = valueKeys(rows)
	const x = keys.find((key) => !key.endsWith('_usd'))
	const y = keys.find((key) => key.endsWith('_usd'))
	return x && y ? { x: labelFor(x), y: labelFor(y) } : null
}

// One cut: its rows, minus the slice index that selected them, minus any column
// null in all of them. Past this point a row stands alone.
function groupOf(question, slice, at, completions) {
	const rows = question.data.filter((row) => row.slice === at)
	const used = new Set()
	for (const row of rows) for (const [key, value] of Object.entries(row)) if (key !== 'slice' && value !== null) used.add(key)

	const series = [...new Set(rows.map((row) => row.series).filter((v) => typeof v === 'string'))]

	return {
		demographic: {
			id: kebabCase(slice.slice_value),
			type: slice.slice_type ?? null,
			name: slice.slice_value,
			n: slice.n ?? null,
			share: typeof slice.n === 'number' && completions ? slice.n / completions : null,
		},
		// Segment order is emission order: the export writes response-major, so the
		// first response sets the stack order for every response after it.
		series: series.length ? series : null,
		data: rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => used.has(key)))),
	}
}

// Everything a figure derives from the data, with no sheet copy attached — a
// question adds its Questions row, a promoted figure its Features row.
function resolve(ctx, chapterId, dataId, where, chart) {
	const question = ctx.data[chapterId]?.[dataId]
	if (!question) return ctx.fail(`${where}: no question "${dataId}" in ${chapterId}.json`)
	// A chapter is skipped wholesale when nothing in it is tidy, so reaching here
	// with a legacy question means the file is half-migrated.
	if (!isTidy(question)) return ctx.fail(`${where}: "${dataId}" is still the legacy format`)

	const groups = question.meta.slices.map((slice, at) => groupOf(question, slice, at, ctx.completions))
	if (!groups.length) return ctx.fail(`${where}: "${dataId}" declares no slices`)

	const definition = ctx.bank[question.meta?.qname] ?? null
	const rows = groups[0].data
	const axes = chart === 'scatter' ? axesFor(rows) : null

	if (chart === 'scatter' && !axes) {
		return ctx.fail(`${where}: a scatter needs one non-currency and one currency column, found ${valueKeys(rows).join(', ')}`)
	}

	// `response -> short` for the strings this figure draws, from the question bank.
	const asked = Object.fromEntries((definition?.options ?? []).filter((o) => o?.short).map((o) => [o.label, o.short]))
	const shorts = {}
	for (const row of question.data) for (const v of [row.response, row.series]) if (asked[v]) shorts[v] = asked[v]

	return { dataId, question: question.meta?.question ?? null, definition, value: valueFor(rows), axes, shorts, groups }
}

// A question with every cut. The cuts are the only copy of the rows — spreading
// the first one flat as well would write every row twice, and both pages already
// fall back to `demographics[0]`.
function figureOf(ctx, chapterId, q) {
	const { groups, ...resolved } = resolve(ctx, chapterId, q.dataId, `question "${q.name}" (${chapterId})`, q.chart) ?? {}
	if (!groups) return null

	return {
		kind: 'figure',
		...q,
		id: q.dataIdSlug,
		descriptionHtml: html(q.description),
		...resolved,
		subtext: q.subtext || null,
		demographics: groups,
	}
}

// A figure the sheet promoted, narrowed to the one cut and the rows it asked for.
function featureOf(ctx, chapter, ref) {
	if (ref.chart === 'quote')
		return { kind: 'quote', chart: 'quote', headline: ref.headline, description: ref.description, descriptionHtml: html(ref.description) }

	const where = `${ref.tier} "${ref.headline}" (${chapter.id})`
	const { groups, ...resolved } = resolve(ctx, chapter.id, ref.dataId, where, ref.chart) ?? {}
	if (!groups) return null

	const wanted = ref.dataset?.[0]
	const group = wanted ? groups.find((g) => g.demographic.id === kebabCase(wanted) || g.demographic.name === wanted) : groups[0]
	if (!group) return ctx.fail(`${where}: no cut "${wanted}" — has ${groups.map((g) => g.demographic.name).join(', ')}`)

	let data = group.data

	// Responses get reworded between years, and the figure would render empty.
	const missing = (ref.values ?? []).filter((v) => !data.some((r) => r.response === v))
	if (missing.length) return ctx.fail(`${where}: no row ${missing.join(', ')} — rows are ${data.map((r) => r.response).join(', ')}`)

	if (ref.values?.length) data = ref.values.map((v) => data.find((r) => r.response === v))
	if (ref.limit) data = data.slice(0, Number(ref.limit))

	// The section and slug the question sits at, for the "in context" link.
	const section = (chapter.sections ?? []).find((s) => (s.questions ?? []).some((q) => q.dataId === ref.dataId))

	return {
		kind: 'figure',
		...resolved,
		...group,
		chart: ref.chart,
		headline: ref.headline,
		description: ref.description,
		descriptionHtml: html(ref.description),
		subtext: ref.subtext || null,
		section: section?.name ?? null,
		slug: (section?.questions ?? []).find((q) => q.dataId === ref.dataId)?.dataIdSlug ?? null,
		data,
	}
}

const featuresOf = (ctx, chapter, tier) =>
	(chapter.features ?? [])
		.filter((f) => f.tier === tier)
		.map((f) => featureOf(ctx, chapter, f))
		.filter(Boolean)

// --- assembly ----------------------------------------------------------------

// Only write when the bytes changed: the generator writes inside Vite's watched
// root, so an unconditional write is a reload, which is another run.
async function write(file, value, state) {
	const target = path.join(OUT, file)
	const body = `${JSON.stringify(value, null, '\t')}\n`
	const existing = await fs.readFile(target, 'utf8').catch(() => null)

	state.bytes += Buffer.byteLength(body)
	if (existing === body) return

	await fs.mkdir(path.dirname(target), { recursive: true })
	await fs.writeFile(target, body)

	state.changed++
	if (existing === null) state.structural = true
}

export async function generate() {
	const { survey, data, bank, methodology } = await readInputs()
	const years = await readYears()

	// Collected, not thrown one at a time: whoever has to fix the sheet or rerun
	// the pipeline should get the whole list in one pass.
	const problems = []
	const ctx = { data, bank, completions: methodology.TotalRespondents, fail: (message) => void problems.push(message) }

	// A chapter whose export hasn't been regenerated doesn't exist yet, so it is
	// skipped rather than failed — no route, no nav, no sitemap entry.
	const live = survey.chapters.filter((chapter) => {
		const file = data[chapter.id]

		if (!file) return void console.error(`⚠ chapter "${chapter.id}" skipped — no src/data/${chapter.id}.json`)
		if (!Object.values(file).some(isTidy)) return void console.error(`⚠ chapter "${chapter.id}" skipped — still the legacy format`)

		return true
	})

	for (const id of Object.keys(data)) {
		if (id !== 'methodology' && !survey.chapters.some((c) => c.id === id))
			console.error(`⚠ src/data/${id}.json is not claimed by any chapter`)
	}

	const summaries = live.map(summary)
	const wrap = (i) => summaries[(i + summaries.length) % summaries.length]
	const nextTo = (id) => {
		const at = summaries.findIndex((c) => c.id === id)
		return { previous: ref(wrap(at - 1)), next: ref(wrap(at + 1)) }
	}

	const state = { changed: 0, bytes: 0, structural: false }
	const index = {}
	const axes = []

	// Built in memory first: the schema.org graphs need every chapter's questions
	// resolved before any payload can be written.
	const chapterPayloads = {}
	const questionPayloads = {}

	for (const chapter of live) {
		// Questions flattened out of their sections, so neighbours are findable.
		const flat = (chapter.sections ?? []).flatMap((section) =>
			(section.questions ?? []).map((q) => ({ ...q, sectionId: section.id, sectionName: section.name }))
		)

		const drawable = flat.map((q) => figureOf(ctx, chapter.id, q)).filter(Boolean)
		const sibling = (i) => (drawable[i] ? { slug: drawable[i].dataIdSlug, name: drawable[i].name } : null)

		index[chapter.id] = drawable.map((f) => ({ slug: f.dataIdSlug, name: f.name }))
		for (const f of drawable) if (f.axes) axes.push(`${f.dataId}: x=${f.axes.x.key} y=${f.axes.y.key}`)

		chapterPayloads[chapter.id] = {
			...summary(chapter),
			sections: (chapter.sections ?? []).map((section) => ({
				...section,
				questions: (section.questions ?? []).map((q) => drawable.find((f) => f.dataId === q.dataId)).filter(Boolean),
			})),
			...nextTo(chapter.id),
		}

		for (const [at, figure] of drawable.entries()) {
			questionPayloads[`${chapter.id}/${figure.dataIdSlug}`] = {
				question: { ...figure, previous: sibling(at - 1), next: sibling(at + 1) },
				chapter: ref(chapter),
			}
		}
	}

	const seo = graphsFor({ survey, years, chapters: summaries, chapterPayloads })

	for (const chapter of live) {
		await write(
			`chapter/${chapter.id}.json`,
			{ ...summary(chapter), highlights: featuresOf(ctx, chapter, 'highlight'), ...nextTo(chapter.id), jsonld: seo.chapter[chapter.id] },
			state
		)

		await write(`data/${chapter.id}.json`, { ...chapterPayloads[chapter.id], jsonld: seo.dataPage[chapter.id] }, state)
	}

	for (const [key, payload] of Object.entries(questionPayloads)) {
		await write(`question/${key}.json`, { ...payload, jsonld: seo.question[key] }, state)
	}

	await write('year.json', { chapters: live.map((c) => ({ ...summary(c), heroes: featuresOf(ctx, c, 'hero') })), jsonld: seo.year }, state)

	const year = String(survey.settings.year)

	await write(
		'site.json',
		{
			settings: survey.settings,
			methodology,
			jsonld: { home: seo.home, methodology: seo.methodology },
			chapters: summaries,
			questions: index,
			// Which routes to prerender, so no route recomputes the list.
			entries: {
				year: [{ year }],
				chapter: summaries.map(({ id }) => ({ year, chapter: id })),
				question: summaries.flatMap(({ id }) => index[id].map(({ slug }) => ({ year, chapter: id, question: slug }))),
			},
		},
		state
	)

	if (problems.length) throw new Error(`data: ${problems.length} problem(s)\n\n  ${problems.join('\n  ')}\n`)

	for (const line of axes) console.error(`· scatter ${line}`)

	return { ...state, chapters: live.length, questions: Object.values(index).flat().length }
}

export const summarise = (r) =>
	`✅ ${r.chapters} chapters, ${r.questions} questions → src/generated (${r.changed} written, ${Math.round(r.bytes / 1024)} KB)`

// Run directly, rather than imported by the Vite plugin.
if (process.argv[1] === fileURLToPath(import.meta.url)) console.error(summarise(await generate()))
