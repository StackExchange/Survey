// Public type surface for the survey package.
//
// Schema-derived types come from `./generated.ts` (regenerate with
// `npm run gen:types -w survey` after editing either schema). This file:
//   - re-exports the generated types under friendlier names,
//   - extracts nested shapes (Validate, ScaleSpec, OptionEntry) used by
//     question components,
//   - declares runtime-only types the schemas don't cover (`Answer`, `Page`).
//
// If you find yourself wanting to edit a schema-derived type here, change
// the schema instead and regenerate.

import type {
	Condition,
	FlowElement as _FlowElement,
	PageEntry as _PageEntry,
	SurveyQuestion as _SurveyQuestion,
	SurveyStructure,
} from './generated'

export type { Condition }
export type Survey = SurveyStructure

export type Question = _SurveyQuestion['question']
export type OptionEntry = NonNullable<Question['options']>[number]
export type Validate = NonNullable<Question['validate']>
export type ScaleSpec = NonNullable<Question['scale']>

export type FlowElement = _FlowElement
export type BlockElement = Extract<FlowElement, { block: string }>

// A page within a block: a single id, an id list, or an if/then wrapping
// nested page entries. Schema-derived.
export type PageEntry = _PageEntry

// --- runtime-only types (not derivable from any schema) -----------------

// One page in the rendered preview: a set of questions to show together,
// optionally gated by a condition that came from a parent BranchElement.
export interface Page {
	block: string
	questions: string[]
	condition?: Condition
}

// Answer state — one entry per answered question.
//   single_select / dropdown / nps:  string (the chosen key) | number (nps)
//   multi_select / rank:             string[] (chosen keys; rank order = array order)
//   free_text:                       string
//   scale (single):                  { [rowKey]: columnKey }
//   scale (multi):                   { [rowKey]: columnKey[] }
//   display / meta:                  never written
export type Answer = string | number | string[] | Record<string, string | string[]> | undefined
