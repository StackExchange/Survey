// Every published page, once. The sitemap, llms.txt, the .md twins and their
// prerender entries all derive from `listPages()`, so the four cannot drift.
import years from '$archive/index.json'
import methodologyData from '$data/methodology.json'

import { licence, siteDescription, siteName, siteUrl } from '$lib/constants'
import { ofSurvey, toMarkdown } from '$lib/table'

import { getChapter, getChapterData, getChapters, getQuestion, listChapters, listQuestions, settings } from './content'

const year = String(settings.year)

export type PageKind = 'home' | 'year' | 'chapter' | 'methodology' | 'data' | 'question'

export interface PageRef {
	kind: PageKind
	path: string
	markdown: string
	title: string
	description: string
	// Passed to a .md endpoint's `entries` verbatim.
	params: Record<string, string>
}

const ref = (kind: PageKind, path: string, title: string, description: string, params: Record<string, string>): PageRef => ({
	kind,
	path,
	markdown: path === '/' ? '/index.md' : `${path}.md`,
	title,
	description,
	params,
})

export function listPages(): PageRef[] {
	const chapters = listChapters()

	return [
		ref('home', '/', siteName, siteDescription, {}),
		ref('year', `/${year}`, `${siteName} ${year}`, settings.description, { year }),
		...chapters.flatMap(({ id, name, description }: any) => [
			ref('chapter', `/${year}/${id}`, `${name} ${year}`, description?.trim() || `The ${name} chapter.`, { year, page: id }),
			ref('data', `/${year}/${id}/data`, `${name} data ${year}`, `Every figure in the ${name} chapter, with sample sizes.`, {
				year,
				chapter: id,
			}),
			...listQuestions(id).map(({ slug, name: question }: any) =>
				ref('question', `/${year}/${id}/data/${slug}`, `${question} ${year}`, `${question}, by respondent group.`, {
					year,
					chapter: id,
					question: slug,
				})
			),
		]),
		ref('methodology', `/${year}/methodology`, `Methodology ${year}`, 'How the survey was run and how the numbers were worked out.', {
			year,
			page: 'methodology',
		}),
	]
}

const join = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join('\n\n')

const count = (n: number | null | undefined) => n?.toLocaleString('en-US') ?? '—'

const frontMatter = (page: PageRef, extra: Record<string, string> = {}) =>
	[
		'---',
		`title: ${JSON.stringify(page.title)}`,
		`url: ${siteUrl}${page.path}`,
		`year: ${year}`,
		...Object.entries(extra).map(([key, value]) => `${key}: ${JSON.stringify(value)}`),
		`licence: ${JSON.stringify(`${licence.database.name} (${licence.database.url})`)}`,
		'---',
	].join('\n')

// Same wording as the figcaption and the table caption, from the same helper.
function nLine(demographic: any) {
	const share = ofSurvey(demographic?.share)
	return `n = ${count(demographic?.n)}${share ? ` (${share})` : ''}`
}

// From the bank where it resolves, the export otherwise.
function asked(block: any) {
	const d = block.definition
	if (!d) return `Asked as: ${block.question} (\`${block.dataId}\`)`

	const meta = [`\`${d.id}\``, d.type.replace(/_/g, ' '), d.required ? 'required' : 'optional', `v${d.version}`]
	return `Asked as: ${d.title} (${meta.join(', ')})`
}

function figure(block: any, heading: string) {
	// A quote is its own copy, so it drops the caller's heading rather than
	// printing the same text twice.
	if (block.kind === 'quote') return join(`> ${block.headline}`, block.description)

	return join(
		heading,
		block.description,
		asked(block),
		`${block.demographic?.name} · ${nLine(block.demographic)}`,
		block.subtext && `_${block.subtext}_`,
		toMarkdown(block.data, block.metadata?.labels)
	)
}

function home(page: PageRef) {
	const [current, ...past] = years as any[]

	return join(
		frontMatter(page),
		`# ${siteName}`,
		settings.descriptionLong,
		`## ${current.year}`,
		`- [Results](${siteUrl}/${year})\n- [Methodology](${siteUrl}/${year}/methodology)`,
		'## Past years',
		past
			.map(({ year: y, results, data }: any) => {
				const link = results.startsWith('/') ? `${siteUrl}${results}` : results
				return `- [${y} results](${link})${data ? ` · [responses (CSV)](${data})` : ''}`
			})
			.join('\n'),
		`Cite as: ${siteName}, ${licence.holder}`
	)
}

function yearPage(page: PageRef) {
	const chapters = getChapters()

	return join(
		frontMatter(page),
		`# ${siteName} ${year}`,
		settings.descriptionLong,
		'## Chapters',
		chapters
			.map(
				({ id, name, description }: any) =>
					`- [${name}](${siteUrl}/${year}/${id}) · [all data](${siteUrl}/${year}/${id}/data)${description?.trim() ? `: ${description.trim()}` : ''}`
			)
			.join('\n'),
		'## Headline figures',
		chapters.flatMap((chapter: any) => chapter.heroes.map((hero: any) => figure(hero, `### ${chapter.name}`))).join('\n\n')
	)
}

function chapterPage(page: PageRef, id: string) {
	const chapter = getChapter(id)
	if (!chapter) return null

	return join(
		frontMatter(page, { chapter: id }),
		`# ${chapter.name} ${year}`,
		chapter.description,
		'## Highlights',
		chapter.highlights.map((h: any) => figure(h, `### ${h.headline ?? h.name}`)).join('\n\n'),
		`Every figure in this chapter: ${siteUrl}/${year}/${id}/data.md`
	)
}

function dataPage(page: PageRef, id: string) {
	const chapter = getChapterData(id)
	if (!chapter) return null

	return join(
		frontMatter(page, { chapter: id }),
		`# ${chapter.name} data ${year}`,
		chapter.description,
		chapter.sections
			.map((section: any, i: number) =>
				join(
					`## ${chapter.index}.${i + 1} ${section.name}`,
					section.questions
						.map((q: any) =>
							join(
								figure(q, `### ${q.name ?? q.dataId}`),
								q.kind === 'figure' && `Every respondent group: ${siteUrl}/${year}/${id}/data/${q.id}.md`
							)
						)
						.join('\n\n')
				)
			)
			.join('\n\n')
	)
}

function questionPage(page: PageRef, chapterId: string, slug: string) {
	const question: any = getQuestion(chapterId, slug)
	if (!question || question.kind !== 'figure') return null

	return join(
		frontMatter(page, { chapter: chapterId, question: question.dataId, section: question.sectionName }),
		`# ${question.name}`,
		question.description,
		asked(question),
		question.definition?.options &&
			join(
				'## Options offered',
				question.definition.options
					.map(
						(o: any, i: number) =>
							`${i + 1}. ${typeof o === 'string' ? o : o.label}${typeof o !== 'string' && o.text_entry ? ' (with free-text entry)' : ''}`
					)
					.join('\n')
			),
		'## Results',
		question.demographics
			.map((d: any) =>
				join(`### ${d.demographic.name}`, nLine(d.demographic), d.subtext && `_${d.subtext}_`, toMarkdown(d.data, d.metadata?.labels))
			)
			.join('\n\n'),
		`In context: ${siteUrl}/${year}/${chapterId}/data.md`
	)
}

function methodologyPage(page: PageRef) {
	const data: Record<string, any> = methodologyData
	const scalars = Object.entries(data).filter(([, value]) => typeof value !== 'object')

	return join(
		frontMatter(page),
		`# Methodology ${year}`,
		'How the survey was run, who answered it, and how the numbers here were worked out.',
		scalars.length > 0 &&
			join(
				'## At a glance',
				scalars
					.map(
						([key, value]) =>
							`- ${key.replace(/([a-z])([A-Z])/g, '$1 $2')}: ${typeof value === 'number' ? value.toLocaleString('en-US') : value}`
					)
					.join('\n')
			),
		`Response data is released under the ${licence.database.name} (${licence.database.url}).`,
		`Cite as: ${siteName}, ${licence.holder}`
	)
}

export function renderMarkdown(page: PageRef): string | null {
	const { chapter, question } = page.params

	switch (page.kind) {
		case 'home':
			return home(page)
		case 'year':
			return yearPage(page)
		case 'chapter':
			return chapterPage(page, page.params.page)
		case 'data':
			return dataPage(page, chapter)
		case 'question':
			return questionPage(page, chapter, question)
		case 'methodology':
			return methodologyPage(page)
	}
}
