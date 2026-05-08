// Render a ShowIf expression as a flat token stream for the preview's
// condition notice. Tokens are either plain text or a parent question id
// (rendered as a clickable jump-to button by the consumer).

import type { ShowIf } from '$lib/types'

export type ShowIfToken = { text: string } | { qid: string }

function joinGroups(parts: ShowIfToken[][], sep: string, paren: boolean): ShowIfToken[] {
  const out: ShowIfToken[] = []

  if (paren) out.push({ text: '(' })

	parts.forEach((p, i) => {
		if (i > 0) out.push({ text: sep })
		out.push(...p)
  })

  if (paren) out.push({ text: ')' })

	return out
}

export function tokenizeShowIf(expr: ShowIf): ShowIfToken[] {
	if ('any' in expr && Array.isArray(expr.any)) {
		const parts = (expr.any as ShowIf[]).map(tokenizeShowIf)
		return joinGroups(parts, ' OR ', parts.length > 1)
  }

	if ('all' in expr && Array.isArray(expr.all)) {
		const parts = (expr.all as ShowIf[]).map(tokenizeShowIf)
		return joinGroups(parts, ' AND ', parts.length > 1)
  }

	if ('not' in expr) {
		return [{ text: 'NOT ' }, ...tokenizeShowIf(expr.not as ShowIf)]
  }

  const entries = Object.entries(expr)

  if (entries.length === 0) return [{ text: '(always true)' }]

	const groups = entries.map(([parentId, raw]) => {
		const keys = Array.isArray(raw) ? raw : [raw]
		const tail = keys.length === 1 ? ` = ${keys[0]}` : ` ∈ {${keys.join(', ')}}`
		return [{ qid: parentId } as ShowIfToken, { text: tail } as ShowIfToken]
  })

	return joinGroups(groups, ' AND ', groups.length > 1)
}
