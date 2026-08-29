import years from '$archive/index.json'
import { siteUrl } from '$config'
import site from '$generated/site.json'

export const prerender = true

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export function GET() {
	const current = site.pages.map(({ path }) => path)
	const listed = new Set(current)

	const paths = [
		...current,
		// Filter so only microsites from packages/archive
		...years
			.filter(({ results }) => results?.startsWith('/') || results?.startsWith(siteUrl))
			.map(({ year }) => `/${year}`)
			.filter((path) => !listed.has(path)),
	]

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `\t<url><loc>${escape(`${siteUrl}${path}`)}</loc></url>`).join('\n')}
</urlset>
`

	return new Response(body, { headers: { 'content-type': 'application/xml' } })
}
