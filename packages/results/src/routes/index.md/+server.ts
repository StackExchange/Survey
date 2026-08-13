// The markdown twin of the index page, linked from <head> as rel="alternate".
// Hand-rolled rather than derived from a page index: with one page there is
// nothing for an index to keep in sync.
import years from '$archive/index.json'

import { licence, siteDescriptionLong, siteName, siteUrl } from '$lib/constants'

export const prerender = true

const join = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join('\n\n')

const frontMatter = [
	'---',
	`title: ${JSON.stringify(siteName)}`,
	`url: ${siteUrl}/`,
	`licence: ${JSON.stringify(`${licence.database.name} (${licence.database.url})`)}`,
	'---',
].join('\n')

export function GET() {
	const published = years.filter(({ results }) => results)

	const body = join(
		frontMatter,
		`# ${siteName}`,
		siteDescriptionLong,
		'## Results by year',
		// Absolute: a relative path is meaningless to whatever reads this file next.
		published
			.map(({ year, results, data }) => {
				const link = results!.startsWith('/') ? `${siteUrl}${results}` : results
				return `- [${year} results](${link})${data ? ` · [responses (CSV)](${data})` : ''}`
			})
			.join('\n'),
		`Cite as: ${siteName}, ${licence.holder}`
	)

	return new Response(`${body}\n`, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
