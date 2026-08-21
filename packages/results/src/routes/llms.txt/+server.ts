import years from '$archive/index.json'
import { licence, siteDescriptionLong, siteName, siteUrl } from '$config'
import site from '$generated/site.json'

export const prerender = true

export function GET() {
	const [current, ...past] = years as any[]
	const { year } = site.settings

	const link = (results: string) => (results.startsWith('/') ? `${siteUrl}${results}` : results)

	const body = `# ${siteName}

> ${siteDescriptionLong}

Run every year since ${years[years.length - 1].year}, the survey asks developers about the
technologies they use, how they work, and how they learn. Each year is published at its own
path and stays there, and the response-level data is released once the results are out.

This page covers the survey as a whole. For the full contents of a single year — chapters,
figures, and one page per question — read that year's own index, ${siteUrl}/${year}/llms.txt.

## ${current.year} results

- [${siteName} ${current.year}](${link(current.results)}): ${site.settings.description.trim() || `The ${current.year} results.`}
- [${current.year} index](${siteUrl}/${current.year}/llms.txt): every chapter, figure, and question in ${current.year}.
- [${current.year} methodology](${siteUrl}/${current.year}/methodology): how the survey was run and how the numbers were worked out.

Every page under /${current.year} has a markdown twin at the same URL plus \`.md\`.

## Past years

${past.map(({ year: y, results }) => `- [${y} results](${link(results)})`).join('\n')}

## Response data

Raw responses, one CSV per year, released under the ${licence.database.name}. The files are
large — tens to hundreds of megabytes — and are served from GitHub.

${past
	.filter(({ data }) => data)
	.map(({ year: y, data, source }) => `- [${y} responses (CSV)](${data})${source ? ` — schema and notes: ${source}` : ''}`)
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
