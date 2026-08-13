import site from '$generated/site.json'
import { listPages } from '$lib/server/llms'
import { licence, siteName, siteUrl } from '$config'
import years from '$archive/index.json'

// Nothing links here, so it is also named in `prerender.entries` in vite.config.js.
export const prerender = true

// https://llmstxt.org — an index, not a dump. Generated from the same content
// model as the pages so the two cannot drift.
export function GET() {
	const pages = listPages()
	const { year } = site.settings

	// Names both, so a model can skip the HTML entirely.
	const entry = ({ path, markdown, title, description }: any) =>
		`- [${title}](${siteUrl}${path}): ${description.trim() || title} — markdown: ${siteUrl}${markdown}`

	const of = (...kinds: string[]) => pages.filter(({ kind }) => kinds.includes(kind))

	const body = `# Stack Overflow Developer Survey

> ${site.settings.descriptionLong}

Results are published annually and cover the technologies developers use, how they
work, and how they learn. Response-level data is released for every year.

Every page on this site has a markdown twin at the same URL plus \`.md\`.

## ${year} results

${of('year', 'chapter', 'data').map(entry).join('\n')}

## How it was asked

${of('methodology').map(entry).join('\n')}

## Past years

${years
	.slice(1)
	.map(({ year: past, results }) => `- [${past} results](${results.startsWith('/') ? `${siteUrl}${results}` : results})`)
	.join('\n')}

## Response data

Raw responses, one CSV per year, released under the ${licence.database.name}.

${years
	.slice(1)
	.map(({ year: past, data }) => `- [${past} responses (CSV)](${data})`)
	.join('\n')}

## Optional

One page per question, each with every respondent group and a markdown twin.

${of('question')
	.map(({ path, markdown, title }) => `- [${title}](${siteUrl}${path}) — markdown: ${siteUrl}${markdown}`)
	.join('\n')}

## Licence

Response data: ${licence.database.name} (${licence.database.url})
Individual cell contents: ${licence.contents.name} (${licence.contents.url})
Quoted Stack Overflow posts: ${licence.contributions.name} (${licence.contributions.url})
Source code for this site and the question bank: ${licence.code.name} (${licence.code.url})

Cite as: ${siteName}, ${licence.holder}
`

	return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
