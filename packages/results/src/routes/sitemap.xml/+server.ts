import { listPages } from '$lib/server/pages'
import { siteUrl } from '$lib/constants'
import years from '$archive/index.json'

export const prerender = true

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export function GET() {
	const paths = [
		...listPages().map(({ path }) => path),
		// packages/archive through the proxy in netlify.toml
		...years.slice(1).map(({ year: past }) => `/${past}`),
	]

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `\t<url><loc>${escape(`${siteUrl}${path}`)}</loc></url>`).join('\n')}
</urlset>
`

	return new Response(body, { headers: { 'content-type': 'application/xml' } })
}
