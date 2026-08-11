// Markdown → HTML. Mirrors packages/survey/src/lib/data/markdown.ts.

import { marked } from 'marked'

marked.use({ breaks: true, gfm: true })

// The markdown twin of a page, generated in src/lib/server/pages.ts.
export const markdownPath = (pathname: string) => (pathname === '/' ? '/index.md' : `${pathname.replace(/\/$/, '')}.md`)

export function mdToHtml(md: string): string {
	if (typeof md !== 'string' || md === '') return md ?? ''

	// A single line with no list marker is a fragment, so it renders without the
	// wrapping <p> that would break it out of the sentence it sits in.
	const isInline = !md.includes('\n') && !/^\s*[-*]\s/m.test(md)
	const out = isInline ? marked.parseInline(md) : marked.parse(md)

	return (out as string).trim()
}
