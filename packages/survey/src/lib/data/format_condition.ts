// Render a Condition expression as a flat token stream for the preview's
// condition notice. Tokens are either plain text or a parent question id
// (rendered as a clickable jump-to button by the consumer).

import type { Condition } from '$lib/types'

export type ConditionToken = { text: string } | { qid: string }

function joinGroups(parts: ConditionToken[][], sep: string): ConditionToken[] {
	const out: ConditionToken[] = []
	parts.forEach((p, i) => {
		// Newline before each OR/AND so multi-clause conditions wrap onto
		// new lines for readability. Consumers render with `white-space:
		// pre-wrap`.
		if (i > 0) out.push({ text: `\n${sep.trim()} ` })
		out.push(...p)
	})
	return out
}

// Render a Condition. `negated` is propagated into the leaves and flips the
// join operator at every `any`/`all` level (De Morgan), so we never need to
// render a "NOT (…)" prefix — every leaf becomes "<qid> is not 'value'".
export function tokenizeCondition(expr: Condition, negated = false): ConditionToken[] {
	const rawExpr = expr as unknown as {
		matrix?: { question: string; row: string; column: string; selected?: boolean }
	}

	if ('any' in expr && Array.isArray(expr.any)) {
		const parts = (expr.any as Condition[]).map((e) => tokenizeCondition(e, negated))
		// NOT(A OR B) = (NOT A) AND (NOT B)
		return joinGroups(parts, negated ? ' AND ' : ' OR ')
	}
	if ('all' in expr && Array.isArray(expr.all)) {
		const parts = (expr.all as Condition[]).map((e) => tokenizeCondition(e, negated))
		// NOT(A AND B) = (NOT A) OR (NOT B)
		return joinGroups(parts, negated ? ' OR ' : ' AND ')
	}
	if ('not' in expr) {
		return tokenizeCondition(expr.not as Condition, !negated)
	}
	if (rawExpr.matrix) {
		const selected = rawExpr.matrix.selected ?? true
		const op = negated ? (selected ? 'is not selected' : 'is selected') : selected ? 'is selected' : 'is not selected'
		return [
			{ qid: rawExpr.matrix.question },
			{ text: ` row '${rawExpr.matrix.row}' / column '${rawExpr.matrix.column}' ${op}` },
		]
	}

	const entries = Object.entries(expr)
	if (entries.length === 0) return [{ text: negated ? '(always false)' : '(always true)' }]

	const op = negated ? 'is not' : 'is'
	const groups = entries.map(([parentId, raw]) => {
		const keys = Array.isArray(raw) ? raw : [raw]
		const values = keys.map((k) => `'${k}'`).join(' or ')
		return [{ qid: parentId } as ConditionToken, { text: ` ${op} ${values}` } as ConditionToken]
	})
	return joinGroups(groups, negated ? ' OR ' : ' AND ')
}
