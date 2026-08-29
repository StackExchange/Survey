// The markdown twin of every published page.
//
// The page list itself is built in scripts/data.js and read here as
// `site.pages` — a title or a URL written in this file would be a second
// opinion on what a page is called. The twins exist for models rather than
// people: a browser downloads text/markdown rather than rendering it, and the
// HTML page is what a person follows.
import { error } from '@sveltejs/kit'

import years from '$archive/index.json'
import { citeAs, licence, siteName, siteUrl } from '$config'
import site from '$generated/site.json'
import yearPayload from '$generated/year.json'
import type { PageRef } from '$lib/pages'
import { ofSurvey, respondents, toMarkdown } from '$lib/table'

import { getChapter, getChapterData, getQuestion } from './content'

const year = String(site.settings.year)

const pages = site.pages as PageRef[]

const join = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join('\n\n')

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
	return `n = ${respondents(demographic?.n)}${share ? ` (${share})` : ''}`
}

// From the bank where it resolves, the export otherwise. A derived cut names every
// question it was built from.
function asked(block: any) {
	const found = block.definitions ?? []
	if (!found.length) return `Asked as: ${block.question} (\`${block.dataId}\`)`

	return found
		.map((d: any) => {
			const meta = [`\`${d.id}\``, d.type.replace(/_/g, ' '), d.required ? 'required' : 'optional', `v${d.version}`]
			return `Asked as: ${d.title} (${meta.join(', ')})`
		})
		.join('\n')
}

// Every line prefixed, the blank one included: a bare blank line would close the
// quote and leave the attribution standing as its own paragraph.
const blockquote = (text: string) =>
	text
		.split('\n')
		.map((line) => (line.trim() ? `> ${line}` : '>'))
		.join('\n')

// The heading a block owns, where it has one. A passage between the charts may
// carry only copy, and `### undefined` reads worse than no heading at all.
const headingOf = (block: any, level: string) => {
	const text = block.name || block.headline || block.dataId
	return text ? `${level} ${text}` : null
}

// The three kinds a chapter's stream carries. Only a figure has rows, a cut and a
// bank entry behind it; a quote and a passage are copy the sheet wrote, and either
// can arrive without a headline.
function figure(block: any, heading: string | null) {
	// A quote is its own copy, so it drops the caller's heading rather than
	// printing the same text twice. `description` is the attribution beneath it.
	if (block.kind === 'quote') {
		return blockquote(join(`“${block.headline}”`, block.description?.trim() && `— ${block.description.trim()}`))
	}

	// A passage has no figure behind it: nothing to ask, cut or tabulate.
	if (block.kind === 'text') return join(heading, block.description)

	// A question carries its cuts and nothing flat; a promoted figure is already
	// narrowed to the one cut the sheet asked for.
	const shown = block.demographics ? { ...block, ...block.demographics[0] } : block

	return join(
		heading,
		shown.description,
		asked(shown),
		`${shown.demographic?.name} · ${nLine(shown.demographic)}`,
		shown.subtext && `_${shown.subtext}_`,
		toMarkdown(shown)
	)
}

function home(page: PageRef) {
	const [current, ...past] = years as any[]

	return join(
		frontMatter(page),
		`# ${siteName}`,
		site.settings.descriptionLong,
		`## ${current.year}`,
		`- [Results](${siteUrl}/${year})\n- [Methodology](${siteUrl}/${year}/methodology)`,
		'## Past years',
		past
			.map(({ year: y, results, data }: any) => {
				const link = results.startsWith('/') ? `${siteUrl}${results}` : results
				return `- [${y} results](${link})${data ? ` · [responses (CSV)](${data})` : ''}`
			})
			.join('\n'),
		citeAs
	)
}

function yearPage(page: PageRef) {
	const chapters = yearPayload.chapters

	return join(
		frontMatter(page),
		`# ${siteName} ${year}`,
		site.settings.descriptionLong,
		'## Chapters',
		chapters
			.map(
				({ id, name, description }: any) =>
					`- [${name}](${siteUrl}/${year}/${id}) · [all data](${siteUrl}/${year}/${id}/data)${description?.trim() ? `: ${description.trim()}` : ''}`
			)
			.join('\n'),
		'## Headline figures',
		// One heading per chapter, then each hero under its own headline: a chapter
		// promotes more than one figure, and repeating the chapter name as the heading
		// left the year page with two identical `### Work`s and the headlines nowhere.
		chapters
			.map((chapter: any) =>
				join(`### ${chapter.name}`, chapter.heroes.map((hero: any) => figure(hero, headingOf(hero, '####'))).join('\n\n'))
			)
			.join('\n\n')
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
		chapter.highlights.map((h: any) => figure(h, headingOf(h, '###'))).join('\n\n'),
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
								figure(q, headingOf(q, '###')),
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
	// The payload is `{ question, chapter }` — the same object the route returns.
	const question: any = getQuestion(chapterId, slug)?.question
	if (!question || question.kind !== 'figure') return null

	return join(
		frontMatter(page, { chapter: chapterId, question: question.dataId, section: question.sectionName }),
		`# ${question.name}`,
		question.description,
		asked(question),
		question.definitions?.[0]?.options &&
			join(
				'## Options offered',
				question.definitions[0].options
					.map(
						(o: any, i: number) =>
							`${i + 1}. ${typeof o === 'string' ? o : o.label}${typeof o !== 'string' && o.text_entry ? ' (with free-text entry)' : ''}`
					)
					.join('\n')
			),
		'## Results',
		// `subtext` describes the question, not the cut, so it sits above the groups
		// rather than being repeated under each one.
		question.subtext && `_${question.subtext}_`,
		question.demographics
			.map((d: any) => join(`### ${d.demographic.name}`, nLine(d.demographic), toMarkdown({ ...question, ...d })))
			.join('\n\n'),
		`In context: ${siteUrl}/${year}/${chapterId}/data.md`
	)
}

function methodologyPage(page: PageRef) {
	const data: Record<string, any> = site.methodology
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
		citeAs
	)
}

function renderMarkdown(page: PageRef): string | null {
	const { chapter, question } = page.params

	switch (page.kind) {
		case 'home':
			return home(page)
		case 'year':
			return yearPage(page)
		case 'chapter':
			return chapterPage(page, chapter)
		case 'data':
			return dataPage(page, chapter)
		case 'question':
			return questionPage(page, chapter, question)
		case 'methodology':
			return methodologyPage(page)
	}
}

// Nothing links to the .md twins as routes — the alternate link is absolute, so
// the crawler skips it — so the endpoint names its own entries. `/index.md` and
// `/2026/work/data.md` alike, minus the leading slash and the extension the route
// supplies.
export const markdownEntries = () => pages.map((page) => ({ page: page.markdown.slice(1, -'.md'.length) }))

export function markdown(path: string) {
	const page = pages.find((entry) => entry.markdown === `/${path}.md`)
	const body = page && renderMarkdown(page)

	if (!body) error(404, 'No markdown for this page')

	return new Response(`${body}\n`, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
