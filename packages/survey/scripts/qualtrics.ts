// Qualtrics transform + API client library for the survey sync script.
//
// This is the pure(ish) half of the Qualtrics tooling: the canonical
// friendly-type -> Qualtrics-type lookup (`TYPE_TABLE`), the YAML-question ->
// Qualtrics-payload transform, and a thin `fetch` wrapper around the Survey
// Definitions API. The orchestration (load YAML, reconcile, dry-run) lives in
// `qualtrics-sync.ts`.
//
// The friendly `type` (+ `display`/`lines`/`scale.multiple` modifiers) maps
// deterministically to the Qualtrics QuestionType/Selector/SubSelector triple;
// see the table in questions/README.md, which this file is the implementation
// of. Several exact payload sub-field spellings (Randomization, content-type
// validation, NPS labels) are best confirmed against a live GET of an existing
// survey — those spots are flagged with `PHASE-0` comments.

import { snakeCase } from 'lodash-es'
import { marked } from 'marked'
import type { OptionEntry, Question, Validate } from '../src/lib/types/index.ts'

// --- type mapping -------------------------------------------------------

export interface TypeTriple {
	QuestionType: string
	Selector: string
	SubSelector?: string
}

// Canonical lookup, keyed by a discriminator derived from `type` + modifier.
// Mirrors the "Type mapping" table in questions/README.md exactly.
export const TYPE_TABLE: Record<string, TypeTriple> = {
	single_select: { QuestionType: 'MC', Selector: 'SAVR', SubSelector: 'TX' },
	'single_select:dropdown': { QuestionType: 'MC', Selector: 'DL' },
	multi_select: { QuestionType: 'MC', Selector: 'MAVR', SubSelector: 'TX' },
	nps: { QuestionType: 'MC', Selector: 'NPS' },
	'free_text:single': { QuestionType: 'TE', Selector: 'SL' },
	'free_text:multi': { QuestionType: 'TE', Selector: 'ML' },
	rank: { QuestionType: 'RO', Selector: 'DND', SubSelector: 'TX' },
	'scale:single': { QuestionType: 'Matrix', Selector: 'Likert', SubSelector: 'SingleAnswer' },
	'scale:multiple': { QuestionType: 'Matrix', Selector: 'Likert', SubSelector: 'MultipleAnswer' },
	display: { QuestionType: 'DB', Selector: 'TB' },
	meta: { QuestionType: 'Meta', Selector: 'Browser' },
}

// Compute the TYPE_TABLE key for a question from its type + modifiers.
export function typeKey(q: Question): string {
	switch (q.type) {
		case 'single_select':
			return q.display === 'dropdown' ? 'single_select:dropdown' : 'single_select'
		case 'free_text':
			return q.lines === 'multi' ? 'free_text:multi' : 'free_text:single'
		case 'scale':
			return q.scale?.multiple ? 'scale:multiple' : 'scale:single'
		default:
			return q.type
	}
}

export function typeTripleFor(q: Question): TypeTriple {
	const triple = TYPE_TABLE[typeKey(q)]
	if (!triple) throw new Error(`No Qualtrics type mapping for question "${q.id}" (type ${q.type})`)
	return triple
}

// --- option helpers (must match runtime key derivation in load.ts) ------

export function optionLabel(o: OptionEntry): string {
	return typeof o === 'string' ? o : o.label
}

// Explicit `key` wins; otherwise the implicit lodash snakeCase(label) slug,
// exactly as the preview runtime and survey.yaml `if/then` blocks resolve it.
export function optionKey(o: OptionEntry): string {
	if (typeof o === 'string') return snakeCase(o)
	return o.key ?? snakeCase(o.label)
}

export function isTextEntry(o: OptionEntry): boolean {
	return typeof o !== 'string' && o.text_entry === true
}

// --- Markdown -> HTML (Qualtrics QuestionText/choices are HTML) ----------

function mdBlock(src: string): string {
	return (marked.parse(src, { async: false }) as string).trim()
}

function mdInline(src: string): string {
	return (marked.parseInline(src, { async: false }) as string).trim()
}

function stripTags(html: string): string {
	return html
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

// --- Qualtrics payload types --------------------------------------------

export interface QualtricsChoice {
	Display: string
	// Present only where the reference survey has it: 'true' on the free-input
	// "Other" choice (MC/multi/rank), '1' on Meta/Browser fields. Normal choices
	// omit it.
	TextEntry?: 'true' | '1'
}

export interface QualtricsRandomization {
	Type: string
	Advanced: unknown
	ConsistentScaleReversal?: boolean
	EvenPresentation?: boolean
	TotalRandSubset?: number | string
}

export interface QualtricsValidation {
	Settings: Record<string, unknown>
}

export interface QualtricsQuestionPayload {
	QuestionText: string
	QuestionType: string
	Selector: string
	SubSelector?: string
	DataExportTag: string
	QuestionDescription: string
	Choices?: Record<string, QualtricsChoice>
	ChoiceOrder?: string[]
	Answers?: Record<string, { Display: string }>
	AnswerOrder?: string[]
	// NPS anchor labels: [min, max].
	ColumnLabels?: { Display: string; IsLabelDefault: boolean }[]
	Validation?: QualtricsValidation
	Randomization?: QualtricsRandomization
	Configuration?: Record<string, unknown>
}

// Standard browser-metadata fields for a Meta/Browser question.
const META_BROWSER_FIELDS = ['Browser', 'Version', 'Operating System', 'Screen Resolution', 'Flash Version', 'Java Support', 'User Agent']

const NPS_DEFAULT_MIN = 0
const NPS_DEFAULT_MAX = 10

// --- validation ---------------------------------------------------------

// ContentType spellings confirmed against the reference survey (ValidNumber).
const CONTENT_TYPE: Record<NonNullable<Validate>['type'], string> = {
	number: 'ValidNumber',
	email: 'ValidEmail',
	phone: 'ValidPhone',
	zip: 'ValidZip',
	date: 'ValidDate',
}

// Every question carries a Validation block in the reference survey, so this
// always returns one (Type:"None" when there's nothing to validate). Numeric
// bounds are sent as strings, matching the reference shape.
export function validationToSettings(q: Question, aiTextChecks?: unknown): QualtricsValidation {
	const settings: Record<string, unknown> = {
		ForceResponse: q.required ? 'ON' : 'OFF',
		Type: 'None',
	}

	const v = q.validate
	if (v) {
		settings.Type = 'ContentType'
		settings.ContentType = CONTENT_TYPE[v.type]
		if (v.type === 'number') {
			const valid: Record<string, string> = { NumDecimals: String(v.decimals ?? 0) }
			if (v.min !== undefined) valid.Min = String(v.min)
			if (v.max !== undefined) valid.Max = String(v.max)
			settings.ValidNumber = valid
		}
	}

	// `defaults.ai_text_checks` from survey.yaml is attached to free-text
	// questions when present (the reference survey stores these under
	// Validation.Settings.AITextAnalysis). survey.yaml may not carry it yet.
	if (aiTextChecks && q.type === 'free_text') {
		settings.AITextAnalysis = aiTextChecks
	}

	return { Settings: settings }
}

// --- randomization ------------------------------------------------------

// Build the Randomization block from `randomize: true`, pinning any text-entry
// ("Other") choice to the end. With no anchor, Type:"All" randomizes every
// choice. With an anchor, Advanced randomization is used: FixedOrder has one
// slot per choice in display order, where each randomized slot is the literal
// token "{~Randomized~}" and an anchored choice is named by its choice key.
const RANDOMIZED_SLOT = '{~Randomized~}'
function buildRandomization(orderedKeys: string[], anchoredLast: string[]): QualtricsRandomization {
	if (anchoredLast.length === 0) {
		return { Type: 'All', Advanced: null, TotalRandSubset: '' }
	}
	const randomized = orderedKeys.filter((k) => !anchoredLast.includes(k))
	return {
		Type: 'Advanced',
		Advanced: {
			FixedOrder: orderedKeys.map((k) => (anchoredLast.includes(k) ? k : RANDOMIZED_SLOT)),
			RandomizeAll: randomized,
			RandomSubSet: [],
			ScaleReversal: [],
			Undisplayed: [],
			TotalRandSubset: 0,
		},
		ConsistentScaleReversal: false,
		EvenPresentation: false,
		TotalRandSubset: '',
	}
}

// --- choice/answer builders ---------------------------------------------

interface ChoiceBlock {
	Choices: Record<string, QualtricsChoice>
	ChoiceOrder: string[]
	textEntryKeys: string[]
}

// The reference survey carries neither RecodeValues nor ChoiceDataExportTags
// (Qualtrics applies its own defaults; the YAML is not a per-choice override
// store — see questions/README.md), so we don't send them.
function buildChoices(options: OptionEntry[]): ChoiceBlock {
	const Choices: Record<string, QualtricsChoice> = {}
	const ChoiceOrder: string[] = []
	const textEntryKeys: string[] = []

	options.forEach((opt, i) => {
		const ck = String(i + 1)
		const te = isTextEntry(opt)
		if (te) textEntryKeys.push(ck)
		const choice: QualtricsChoice = { Display: mdInline(optionLabel(opt)) }
		if (te) choice.TextEntry = 'true'
		Choices[ck] = choice
		ChoiceOrder.push(ck)
	})

	return { Choices, ChoiceOrder, textEntryKeys }
}

// NPS choices are keyed by the score itself ("0".."10"), no RecodeValues, and
// the two anchor labels live in ColumnLabels [min, max] — matching the
// reference survey.
function buildNpsChoices(q: Question): Pick<QualtricsQuestionPayload, 'Choices' | 'ChoiceOrder' | 'ColumnLabels'> {
	const min = q.scale_min ?? NPS_DEFAULT_MIN
	const max = q.scale_max ?? NPS_DEFAULT_MAX
	const Choices: Record<string, QualtricsChoice> = {}
	const ChoiceOrder: string[] = []

	for (let n = min; n <= max; n++) {
		const ck = String(n)
		Choices[ck] = { Display: String(n) }
		ChoiceOrder.push(ck)
	}

	const out: Pick<QualtricsQuestionPayload, 'Choices' | 'ChoiceOrder' | 'ColumnLabels'> = { Choices, ChoiceOrder }
	if (q.scale_labels?.min || q.scale_labels?.max) {
		out.ColumnLabels = [
			{ Display: mdInline(q.scale_labels?.min ?? ''), IsLabelDefault: false },
			{ Display: mdInline(q.scale_labels?.max ?? ''), IsLabelDefault: false },
		]
	}
	return out
}

function buildMatrixAnswers(columns: string[]): Pick<QualtricsQuestionPayload, 'Answers' | 'AnswerOrder'> {
	const Answers: Record<string, { Display: string }> = {}
	const AnswerOrder: string[] = []
	columns.forEach((col, i) => {
		const ak = String(i + 1)
		Answers[ak] = { Display: mdInline(col) }
		AnswerOrder.push(ak)
	})
	return { Answers, AnswerOrder }
}

// --- the main transform -------------------------------------------------

export function toQuestionPayload(q: Question, aiTextChecks?: unknown): QualtricsQuestionPayload {
	const triple = typeTripleFor(q)
	const base: QualtricsQuestionPayload = {
		QuestionText: mdBlock(q.title),
		QuestionType: triple.QuestionType,
		Selector: triple.Selector,
		DataExportTag: q.id,
		QuestionDescription: stripTags(mdInline(q.title)).slice(0, 100),
		Configuration: { QuestionDescriptionOption: 'UseText' },
	}
	if (triple.SubSelector) base.SubSelector = triple.SubSelector

	switch (q.type) {
		case 'single_select':
		case 'multi_select':
		case 'rank': {
			const block = buildChoices(q.options ?? [])
			base.Choices = block.Choices
			base.ChoiceOrder = block.ChoiceOrder
			if (q.randomize) base.Randomization = buildRandomization(block.ChoiceOrder, block.textEntryKeys)
			break
		}
		case 'nps': {
			Object.assign(base, buildNpsChoices(q))
			break
		}
		case 'scale': {
			const block = buildChoices(q.options ?? [])
			base.Choices = block.Choices
			base.ChoiceOrder = block.ChoiceOrder
			Object.assign(base, buildMatrixAnswers(q.scale?.columns ?? []))
			if (q.randomize) base.Randomization = buildRandomization(block.ChoiceOrder, block.textEntryKeys)
			break
		}
		case 'meta': {
			// Reference Meta/Browser carries Choices but no ChoiceOrder.
			const Choices: Record<string, QualtricsChoice> = {}
			META_BROWSER_FIELDS.forEach((field, i) => {
				Choices[String(i + 1)] = { Display: field, TextEntry: '1' }
			})
			base.Choices = Choices
			break
		}
		case 'free_text':
		case 'display':
			break
	}

	// Every reference question has a Validation block except Meta/Browser.
	if (q.type !== 'meta') base.Validation = validationToSettings(q, aiTextChecks)
	return base
}

// Randomization is set via a follow-up PUT rather than at create time: the
// create endpoint requires DataExportTag (so we keep that), but Randomization
// is more likely to trip create-time validation.
const CREATE_UNSAFE_FIELDS: (keyof QualtricsQuestionPayload)[] = ['Randomization']

export function createSafePayload(full: QualtricsQuestionPayload): Partial<QualtricsQuestionPayload> {
	const out: Partial<QualtricsQuestionPayload> = { ...full }
	for (const f of CREATE_UNSAFE_FIELDS) delete out[f]
	return out
}

// --- change detection ---------------------------------------------------

// A normalized, comparable shape extracted from EITHER our desired payload or
// an existing question object from a survey-definition GET. Comparing these
// gives meaningful create/update/skip decisions and near-no-op re-runs.
// (Exact-payload diffing is too noisy: the API echoes server-managed fields
// and re-normalizes HTML.)
export interface QuestionSignature {
	type: string
	selector: string
	subSelector: string
	dataExportTag: string
	text: string
	forceResponse: string
	choices: string[]
	answers: string[]
}

interface QuestionLike {
	QuestionType?: string
	Selector?: string
	SubSelector?: string
	DataExportTag?: string
	QuestionText?: string
	Validation?: { Settings?: { ForceResponse?: string } }
	Choices?: Record<string, { Display?: string; TextEntry?: string }>
	ChoiceOrder?: (string | number)[]
	Answers?: Record<string, { Display?: string }>
	AnswerOrder?: (string | number)[]
}

export function questionSignature(q: QuestionLike): QuestionSignature {
	const choiceOrder = (q.ChoiceOrder ?? Object.keys(q.Choices ?? {})).map(String)
	const answerOrder = (q.AnswerOrder ?? Object.keys(q.Answers ?? {})).map(String)
	return {
		type: q.QuestionType ?? '',
		selector: q.Selector ?? '',
		subSelector: q.SubSelector ?? '',
		dataExportTag: q.DataExportTag ?? '',
		text: stripTags(q.QuestionText ?? ''),
		forceResponse: q.Validation?.Settings?.ForceResponse ?? '',
		choices: choiceOrder.map((k) => {
			const c = q.Choices?.[k]
			return stripTags(c?.Display ?? '') + (c?.TextEntry ? ' [TE]' : '')
		}),
		answers: answerOrder.map((k) => stripTags(q.Answers?.[k]?.Display ?? '')),
	}
}

export function signaturesEqual(a: QuestionSignature, b: QuestionSignature): boolean {
	return JSON.stringify(a) === JSON.stringify(b)
}

// --- API client ---------------------------------------------------------

export interface QualtricsConfig {
	token: string
	datacenter: string
	surveyId: string
}

// Shape of the relevant slice of a survey-definition GET result.
export interface SurveyDefinition {
	SurveyID?: string
	Questions: Record<string, QuestionLike & { QuestionID?: string }>
	Blocks: Record<string, QualtricsBlock>
	Flow?: QualtricsFlow
}

export interface QualtricsBlockElement {
	Type: string
	QuestionID?: string
}

export interface QualtricsBlock {
	Type?: string
	ID?: string
	Description?: string
	BlockElements?: QualtricsBlockElement[]
}

export interface QualtricsFlowElement {
	Type: string
	ID?: string
	FlowID?: string
	Flow?: QualtricsFlowElement[]
}

export interface QualtricsFlow {
	Type?: string
	FlowID?: string
	Flow: QualtricsFlowElement[]
	Properties?: Record<string, unknown>
}

export class QualtricsClient {
	private readonly cfg: QualtricsConfig

	constructor(cfg: QualtricsConfig) {
		this.cfg = cfg
	}

	private url(path: string): string {
		return `https://${this.cfg.datacenter}.qualtrics.com/API/v3${path}`
	}

	private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
		const res = await fetch(this.url(path), {
			method,
			headers: {
				'X-API-TOKEN': this.cfg.token,
				'Content-Type': 'application/json',
			},
			body: body === undefined ? undefined : JSON.stringify(body),
		})
		const text = await res.text()
		if (!res.ok) {
			throw new Error(`${method} ${path} -> ${res.status} ${res.statusText}: ${text}`)
		}
		const json = text ? (JSON.parse(text) as { result?: T }) : {}
		return (json.result ?? ({} as T)) as T
	}

	getDefinition(): Promise<SurveyDefinition> {
		return this.req<SurveyDefinition>('GET', `/survey-definitions/${this.cfg.surveyId}`)
	}

	createQuestion(blockId: string, payload: unknown): Promise<{ QuestionID: string }> {
		return this.req('POST', `/survey-definitions/${this.cfg.surveyId}/questions?blockId=${encodeURIComponent(blockId)}`, payload)
	}

	updateQuestion(questionId: string, payload: unknown): Promise<unknown> {
		return this.req('PUT', `/survey-definitions/${this.cfg.surveyId}/questions/${questionId}`, payload)
	}

	deleteQuestion(questionId: string): Promise<unknown> {
		return this.req('DELETE', `/survey-definitions/${this.cfg.surveyId}/questions/${questionId}`)
	}

	createBlock(payload: unknown): Promise<{ BlockID: string }> {
		return this.req('POST', `/survey-definitions/${this.cfg.surveyId}/blocks`, payload)
	}

	updateBlock(blockId: string, payload: unknown): Promise<unknown> {
		return this.req('PUT', `/survey-definitions/${this.cfg.surveyId}/blocks/${blockId}`, payload)
	}

	deleteBlock(blockId: string): Promise<unknown> {
		return this.req('DELETE', `/survey-definitions/${this.cfg.surveyId}/blocks/${blockId}`)
	}

	updateFlow(payload: unknown): Promise<unknown> {
		return this.req('PUT', `/survey-definitions/${this.cfg.surveyId}/flow`, payload)
	}
}
