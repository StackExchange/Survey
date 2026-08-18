import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

import years from '../archive/index.json' with { type: 'json' }
import { generate, summarise } from './scripts/data.js'

// Earlier years are other Netlify deploys, proxied in from netlify.toml
// Exclude them from crawler errors
const archived = new Set(years.map(({ year }) => `/${year}`))

// What the generator reads, so dev can rebuild the payloads when they change.
const inputs = ['src/data', 'src/content/survey.json', '../../questions'].map((p) => path.resolve(import.meta.dirname, p))

export default defineConfig({
	plugins: [
		// Before sveltekit(): scripts/data.js bakes src/data + src/content into the
		// payloads the routes import, so they must exist before the graph resolves.
		// A plugin rather than a prebuild hook — `vite build` run directly, or a
		// Netlify command that drifts, would silently skip a hook.
		{
			name: 'survey-data',
			async buildStart() {
				console.error(summarise(await generate()))
			},
			configureServer(server) {
				server.watcher.add([...inputs])
				server.watcher.on('change', async (file) => {
					if (![...inputs].some((root) => file.startsWith(root))) return
					// A bad data drop shouldn't take the dev server down with it.
					await generate().then(
						(r) => console.error(summarise(r)),
						(error) => console.error(error.message)
					)
				})
			},
		},
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
			},
			alias: {
				$archive: '../archive',
				$config: 'config.ts',
				$content: 'src/content',
				$data: 'src/data',
				$generated: 'src/generated',
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
