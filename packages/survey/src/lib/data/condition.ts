// Evaluate a boolean Condition expression against the current answer state.
//
//   compact:  { ParentId: keyOrKeys }   -> true iff parent's answer includes any of the keys
//   not:      { not: <expr> }
//   any:      { any: [<expr>, ...] }
//   all:      { all: [<expr>, ...] }
//
// Choice keys in the expression match the parent's option keys (explicit
// `key:` or implicit `snakeCase(label)`, resolved at author time by the
// validator). The parent's current answer is whatever the respondent has
// selected: a string for single-select, an array for multi-select; both
// are normalised to a Set for membership testing.

import type { Answer, Condition, Question } from '$lib/types'
import { snakeCase } from 'lodash-es'

function selectedKeys(answer: Answer): Set<string> {
	if (answer === undefined || answer === null) return new Set()
	if (Array.isArray(answer)) return new Set(answer.map(String))
	if (typeof answer === 'string') return new Set([answer])
	return new Set() // numbers/objects/free-text aren't choice answers
}

export function evaluate(expr: Condition, answers: Record<string, Answer>, questions: Record<string, Question>): boolean {
	const rawExpr = expr as unknown as {
		matrix?: { question: string; row: string; column: string; selected?: boolean }
	}

	if ('any' in expr && Array.isArray(expr.any)) {
		return expr.any.some((sub) => evaluate(sub as Condition, answers, questions))
	}
	if ('all' in expr && Array.isArray(expr.all)) {
		return expr.all.every((sub) => evaluate(sub as Condition, answers, questions))
	}
	if ('not' in expr) {
		return !evaluate(expr.not as Condition, answers, questions)
	}
	if (rawExpr.matrix) {
		const { question: parentId, row, column, selected = true } = rawExpr.matrix
		if (!questions[parentId]) return false
		const answer = answers[parentId]
		if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return selected === false

		const rowValue = (answer as Record<string, string | string[]>)[row]
		const columnKey = snakeCase(column)
		const isSelected = Array.isArray(rowValue) ? rowValue.includes(columnKey) : rowValue === columnKey
		return selected ? isSelected : !isSelected
	}

	// Leaf: { ParentId: keyOrKeys }
	for (const [parentId, raw] of Object.entries(expr)) {
		if (!questions[parentId]) return false
		const targetKeys = new Set((Array.isArray(raw) ? raw : [raw]).map(String))
		const chosen = selectedKeys(answers[parentId])
		for (const k of targetKeys) {
			if (chosen.has(k)) return true
		}
		return false
	}

	// Empty object
	return true
}

export function visibleQuestions(
	page: { questions: string[]; condition?: Condition },
	answers: Record<string, Answer>,
	questions: Record<string, Question>
): string[] {
	if (page.condition && !evaluate(page.condition, answers, questions)) return []
	return page.questions.filter((id) => questions[id] && !questions[id].deprecated)
}
