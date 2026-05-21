// Walk the survey-level flow tree and produce a flat ordered list of pages.
// Each page knows the questions to show, the block it belongs to, and any
// ancestor branch condition it inherited (from a flow-level `if/then` or a
// page-level `if/then` inside a block).

import type { BlockElement, FlowElement, Page, PageEntry, Question, Condition } from '$lib/types'

interface FlattenOptions {
	// When true, BlockRandomizer's SubSet is honoured by picking the first
	// `subset` blocks (deterministic). When false, all blocks are visited.
	respectRandomizerSubset?: boolean
}

function pagesFromEntries(
	entries: PageEntry[],
	blockName: string,
	condition: Condition | undefined,
	questions: Record<string, Question>,
): Page[] {
	const out: Page[] = []

	for (const entry of entries) {
		if (typeof entry === 'string' || Array.isArray(entry)) {
			const ids = (Array.isArray(entry) ? entry : [entry]).filter((id) => {
				const q = questions[id]
				// Skip deprecated and unknown questions; the validator already warns.
				return q && !q.deprecated
			})
			if (ids.length === 0) continue
			out.push({
				block: blockName,
				questions: ids,
				...(condition !== undefined ? { condition } : {}),
			})
		} else if (entry && typeof entry === 'object' && 'if' in entry && 'then' in entry) {
			// Page-level if/then: AND the branch condition with any ancestor
			// condition and recurse into its `then` page entries.
			const branchIf = entry.if as Condition
			const next: Condition | undefined = condition !== undefined ? { all: [condition, branchIf] } : branchIf
			out.push(...pagesFromEntries(entry.then as PageEntry[], blockName, next, questions))
		}
	}

	return out
}

function pagesFromBlock(block: BlockElement, condition: Condition | undefined, questions: Record<string, Question>): Page[] {
	return pagesFromEntries(block.pages as PageEntry[], block.block, condition, questions)
}

function walk(elements: FlowElement[], condition: Condition | undefined, questions: Record<string, Question>, opts: FlattenOptions): Page[] {
	const out: Page[] = []

	for (const el of elements) {
		if ('block' in el) {
			out.push(...pagesFromBlock(el, condition, questions))
		} else if ('randomize' in el) {
			const blocks = opts.respectRandomizerSubset ? el.blocks.slice(0, el.randomize) : el.blocks
			out.push(...walk(blocks, condition, questions, opts))
		} else if ('if' in el) {
			const branchIf = el.if as Condition
			const next: Condition | undefined = condition !== undefined ? { all: [condition, branchIf] } : branchIf
			out.push(...walk(el.then, next, questions, opts))
		}
	}

	return out
}

export function flatten(flow: FlowElement[], questions: Record<string, Question>, opts: FlattenOptions = {}): Page[] {
	return walk(flow, undefined, questions, opts)
}
