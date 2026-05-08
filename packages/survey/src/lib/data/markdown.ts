// Browser-side Markdown → HTML. Mirrors scripts/helpers.ts; kept separate so
// the CLI scripts and the Svelte app each have their own clean import paths.

import { marked } from 'marked'

marked.use({ breaks: true, gfm: true })

export function mdToHtml(md: string): string {
  if (typeof md !== 'string' || md === '') return md ?? ''

	const isInline = !md.includes('\n') && !/^\s*[-*]\s/m.test(md)
  const out = isInline ? marked.parseInline(md) : marked.parse(md)

	return (out as string).trim()
}
