import tailwindcss from '@tailwindcss/vite'
import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

import years from '../archive/index.json' with { type: 'json' }

// Earlier years are other Netlify deploys, proxied in from netlify.toml
// Exclude them from crawler errors
const archived = new Set(years.map(({ year }) => `/${year}`))

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
			},
			alias: {
				$archive: '../archive',
				$content: 'src/content',
				$data: 'src/data',
				$charts: 'src/lib/charts',
				$questions: '../../questions',
			},
			paths: {
				relative: false,
			},
			// Nothing links to these, so crawling alone would miss them. `*` covers
			// only routes without required params; routes under [year] declare their
			// own `entries` beside the route.
			prerender: {
				// Nothing links to the endpoints, so they are named rather than crawled.
				entries: ['*', '/sitemap.xml', '/index.md', '/llms.txt'],
				handleHttpError: ({ path, message }) => {
					if (!archived.has(path)) throw new Error(message)
				},
			},
			adapter: adapter(),
		}),
	],
})
