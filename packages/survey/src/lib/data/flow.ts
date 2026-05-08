// Walk the survey-level flow tree and produce a flat ordered list of pages.
// Each page knows the questions to show, the block it belongs to, and any
// ancestor branch condition it inherited.

import type { BlockElement, FlowElement, Page, Question, ShowIf } from '$lib/types'

interface FlattenOptions {
	// When true, BlockRandomizer's SubSet is honoured by picking the first
	// `subset` blocks (deterministic). When false, all blocks are visited.
	respectRandomizerSubset?: boolean
}

function pagesFromBlock(block: BlockElement, condition: ShowIf | undefined, questions: Record<string, Question>): Page[] {
  const out: Page[] = []

	for (const page of block.pages) {
		const ids = (Array.isArray(page) ? page : [page]).filter((id) => {
      const q = questions[id]

			// Skip deprecated and unknown questions; the validator already warns.
			return q && !q.deprecated
    })

    if (ids.length === 0) continue

		out.push({
			block: block.block,
			questions: ids,
			...(condition !== undefined ? { condition } : {}),
		})
  }

	return out
}

function walk(elements: FlowElement[], condition: ShowIf | undefined, questions: Record<string, Question>, opts: FlattenOptions): Page[] {
  const out: Page[] = []

	for (const el of elements) {
		if ('block' in el) {
			out.push(...pagesFromBlock(el, condition, questions))
		} else if ('randomize' in el) {
			const blocks = opts.respectRandomizerSubset ? el.blocks.slice(0, el.randomize) : el.blocks
			out.push(...walk(blocks, condition, questions, opts))
		} else if ('if' in el) {
			const branchIf = el.if as ShowIf
			const next: ShowIf | undefined = condition !== undefined ? { all: [condition, branchIf] } : branchIf
			out.push(...walk(el.then, next, questions, opts))
		}
  }

	return out
}

export function flatten(flow: FlowElement[], questions: Record<string, Question>, opts: FlattenOptions = {}): Page[] {
	return walk(flow, undefined, questions, opts)
}
