// Evaluate a show_if expression against the current answer state.
//
//   compact:  { ParentId: keyOrKeys }   -> true iff parent's answer includes any of the keys
//   not:      { not: <expr> }
//   any:      { any: [<expr>, ...] }
//   all:      { all: [<expr>, ...] }
//
// Choice keys in the expression match the parent's option keys (explicit
// `key:` or implicit `snakeCase(label)`). The parent's current answer is
// whatever the respondent has selected — for single-select it's a string,
// for multi-select an array of strings; both are normalised to a Set for
// membership testing.

import { snakeCase } from 'lodash-es'
import type { Answer, OptionEntry, Question, ShowIf } from '$lib/types'

function optionKey(opt: OptionEntry): string {
  if (typeof opt === 'string') return snakeCase(opt)

	return opt.key ?? snakeCase(opt.label)
}

function selectedKeys(answer: Answer): Set<string> {
  if (answer === undefined || answer === null) return new Set()

  if (Array.isArray(answer)) return new Set(answer.map(String))

  if (typeof answer === 'string') return new Set([answer])

	return new Set() // numbers/objects/free-text aren't choice answers
}

export function evaluate(expr: ShowIf, answers: Record<string, Answer>, questions: Record<string, Question>): boolean {
	if ('any' in expr && Array.isArray(expr.any)) {
		return expr.any.some((sub) => evaluate(sub as ShowIf, answers, questions))
  }

	if ('all' in expr && Array.isArray(expr.all)) {
		return expr.all.every((sub) => evaluate(sub as ShowIf, answers, questions))
  }

	if ('not' in expr) {
		return !evaluate(expr.not as ShowIf, answers, questions)
  }

	// Leaf: { ParentId: keyOrKeys }
	for (const [parentId, raw] of Object.entries(expr)) {
    const parent = questions[parentId]

    if (!parent) return false

		const targetKeys = new Set((Array.isArray(raw) ? raw : [raw]).map(String))
    const chosen = selectedKeys(answers[parentId])

		// The parent's option list defines the resolution; we already check
		// implicit/explicit keys at author time via the validator, so direct
		// set-intersection is enough here.
    void parent.options // (keeps signature in sync, even if unused for now)

		for (const k of targetKeys) {
			if (chosen.has(k)) return true
    }

		return false
  }

	// Empty object
	return true
}

export function visibleQuestions(
	page: { questions: string[]; condition?: ShowIf },
	answers: Record<string, Answer>,
	questions: Record<string, Question>
): string[] {
  if (page.condition && !evaluate(page.condition, answers, questions)) return []

	return page.questions.filter((id) => {
    const q = questions[id]

		if (!q) return false
    if (q.show_if) return evaluate(q.show_if, answers, questions)

		return true
	})
}
