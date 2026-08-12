import years from '$archive/index.json'

import { siteUrl } from '$lib/constants'

export const prerender = true

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')

export function GET() {
	const paths = [
		'/',
		// packages/archive through the proxy in netlify.toml. 2011–2014 have no
		// results page of their own — they point at the announcement blog post — so
		// they are somebody else's to list.
		...years.filter(({ results }) => results?.startsWith('/') || results?.startsWith(siteUrl)).map(({ year }) => `/${year}`),
	]

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `\t<url><loc>${escape(`${siteUrl}${path}`)}</loc></url>`).join('\n')}
</urlset>
`

	return new Response(body, { headers: { 'content-type': 'application/xml' } })
}
