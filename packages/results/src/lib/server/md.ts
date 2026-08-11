import { error } from '@sveltejs/kit'

import { listPages, renderMarkdown, type PageKind, type PageRef } from './pages'

// Nothing links to the .md twins as routes — the alternate link is absolute, so
// the crawler skips it — so every endpoint declares its own entries. Loosely
// typed because each route wants its own RouteParams.
export const entriesFor =
	(...kinds: PageKind[]) =>
	(): any[] =>
		listPages()
			.filter((page) => kinds.includes(page.kind))
			.map(({ params }) => params)

export function markdown(kinds: PageKind[], params: Record<string, string | undefined>) {
	const match = (page: PageRef) => kinds.includes(page.kind) && Object.entries(page.params).every(([key, value]) => params[key] === value)

	const page = listPages().find(match)
	const body = page && renderMarkdown(page)

	if (!body) error(404, 'No markdown for this page')

	return new Response(`${body}\n`, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
