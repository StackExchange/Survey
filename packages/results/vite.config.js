import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import years from '../archive/index.json' with { type: 'json' }

const archived = new Set(years.map(({ year }) => `/${year}`))

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Runes everywhere except dependencies, which may still be in legacy mode.
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),
			},
			alias: {
				$archive: '../archive',
			},
			paths: { relative: false },
			prerender: {
				// Nothing links to the endpoints, so they are named rather than crawled.
				entries: ['*', '/sitemap.xml', '/index.md'],
				handleHttpError: ({ path, message }) => {
					if (!archived.has(path)) throw new Error(message)
				},
			},
			adapter: adapter(),
		}),
	],
})
