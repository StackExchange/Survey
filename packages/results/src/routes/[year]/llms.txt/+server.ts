import type { EntryGenerator } from './$types'

import { licence, siteName, siteUrl } from '$config'
import site from '$generated/site.json'
import { listPages } from '$lib/server/llms'

export const prerender = true

export const entries: EntryGenerator = () => [{ year: site.settings.year }]

export function GET() {
	const pages = listPages()
	const { year } = site.settings

	// Names both, so a model can skip the HTML entirely.
	const entry = ({ path, markdown, title, description }: any) =>
		`- [${title}](${siteUrl}${path}): ${description.trim() || title} — markdown: ${siteUrl}${markdown}`

	const of = (...kinds: string[]) => pages.filter(({ kind }) => kinds.includes(kind))

	const body = `# ${siteName} ${year}

> ${site.settings.descriptionLong}

This is the index for the ${year} results. For the survey as a whole — every year
since 2011, and the response data for each — see ${siteUrl}/llms.txt.

Every page in this year has a markdown twin at the same URL plus \`.md\`.

## Results

${of('year', 'chapter', 'data').map(entry).join('\n')}

## How it was asked

${of('methodology').map(entry).join('\n')}

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

Cite as: ${siteName} ${year}, ${licence.holder}
`

	return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
