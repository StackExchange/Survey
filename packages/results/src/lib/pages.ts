// Every published page, once.
//
// A page's path, its name and the sentence that describes it are written here and
// nowhere else: the `<title>` and meta description, the schema.org `WebPage`, the
// sitemap, both llms.txt indexes, the markdown twin's front matter and the
// prerender entries are all renderings of this list.
//
// Built by scripts/data.js and baked onto `$generated/site.json` as `pages`, so
// nothing at runtime rebuilds it. `params` are the route's own, so an `entries`
// export is a filter and a map.

import { siteDescriptionLong, siteName } from '../../config.ts'

export type PageKind = 'home' | 'year' | 'chapter' | 'methodology' | 'data' | 'question'

export interface PageRef {
	kind: PageKind
	path: string
	markdown: string
	title: string
	description: string
	params: Record<string, string>
}

const ref = (kind: PageKind, path: string, title: string, description: string, params: Record<string, string>): PageRef => ({
	kind,
	path,
	// `/` has no segment of its own to hang `.md` on.
	markdown: path === '/' ? '/index.md' : `${path}.md`,
	title,
	description,
	params,
})

export interface PageInputs {
	settings: { year: string | number; description: string }
	chapters: { id: string; name: string; description?: string }[]
	questions: Record<string, { slug: string; name: string; description?: string }[]>
}

export function pagesFor({ settings, chapters, questions }: PageInputs): PageRef[] {
	const year = String(settings.year)

	return [
		// The one page whose title is the site's: `<Seo>` prints it alone rather than
		// suffixing it with itself.
		ref('home', '/', siteName, siteDescriptionLong, {}),
		ref('year', `/${year}`, `${siteName} ${year}`, settings.description, { year }),
		...chapters.flatMap(({ id, name, description }) => [
			ref('chapter', `/${year}/${id}`, `${name} ${year}`, description?.trim() || `The ${name} chapter.`, { year, chapter: id }),
			ref('data', `/${year}/${id}/data`, `${name} data ${year}`, `Every figure in the ${name} chapter, with sample sizes.`, {
				year,
				chapter: id,
			}),
			...(questions[id] ?? []).map((q) =>
				ref(
					'question',
					`/${year}/${id}/data/${q.slug}`,
					// Named in full: a question's own name reads the same across all 28
					// chapters, and a tab saying only "Relationship to coding" has lost
					// which chapter it belongs to.
					`${q.name} — ${name} data ${year}`,
					q.description?.trim() || `${q.name}, by respondent group.`,
					{ year, chapter: id, question: q.slug }
				)
			),
		]),
		ref('methodology', `/${year}/methodology`, `Methodology ${year}`, 'How the survey was run and how the numbers were worked out.', {
			year,
		}),
	]
}
