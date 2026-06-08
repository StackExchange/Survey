#!/usr/bin/env tsx
// Dump one or more Qualtrics survey definitions to normalized JSON for local
// diffing. A raw GET differs in incidental ways between surveys (QIDs,
// BlockIDs, FlowIDs, *_Unsafe, timestamps), so this keys questions by
// DataExportTag, drops server-assigned ids, rewrites DisplayLogic locators
// QID -> tag, and sorts keys — so a plain `diff` shows real content
// differences, not noise.
//
// Usage (from repo root):
//   npm run sync:qualtrics:dump -w survey                 # dumps QUALTRICS_SURVEY_ID
//   npm run sync:qualtrics:dump -w survey -- SV_a SV_b     # dumps the given ids
// Writes .qualtrics-dumps/<surveyId>.json (git-ignored).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QualtricsClient } from './qualtrics.ts'
import type { SurveyDefinition } from './qualtrics.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const outDir = path.join(repoRoot, '.qualtrics-dumps')

const token = process.env.QUALTRICS_API_TOKEN
const datacenter = process.env.QUALTRICS_DATACENTER
if (!token || !datacenter) {
	console.error('QUALTRICS_API_TOKEN and QUALTRICS_DATACENTER must be set.')
	process.exit(2)
}

const ids = process.argv.slice(2).filter((a) => !a.startsWith('-'))
if (ids.length === 0) {
	const fallback = process.env.QUALTRICS_SURVEY_ID
	if (!fallback) {
		console.error('Pass one or more survey ids, or set QUALTRICS_SURVEY_ID.')
		process.exit(2)
	}
	ids.push(fallback)
}

// Deep-normalize: drop human-readable Description fields and rewrite any QIDxx
// reference (in DisplayLogic locators, QuestionID, etc.) to its DataExportTag.
function deepNorm(value: unknown, qidToTag: Map<string, string>): unknown {
	if (Array.isArray(value)) return value.map((v) => deepNorm(v, qidToTag))
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {}
		for (const [k, v] of Object.entries(value)) {
			if (k === 'Description') continue
			out[k] = deepNorm(v, qidToTag)
		}
		return out
	}
	if (typeof value === 'string') return value.replace(/QID\d+/g, (m) => qidToTag.get(m) ?? m)
	return value
}

// Recursively sort object keys so output ordering is stable across runs.
function sortKeys(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortKeys)
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {}
		for (const k of Object.keys(value as Record<string, unknown>).sort()) out[k] = sortKeys((value as Record<string, unknown>)[k])
		return out
	}
	return value
}

// Server-assigned / volatile fields not worth diffing.
const DROP_QUESTION_FIELDS = new Set([
	'QuestionID',
	'QuestionText_Unsafe',
	'NextChoiceId',
	'NextAnswerId',
	'DataVisibility',
	'GradingData',
	'Language',
	'DefaultChoices',
])

function normalize(def: SurveyDefinition): unknown {
	const qidToTag = new Map<string, string>()
	for (const [qid, q] of Object.entries(def.Questions ?? {})) if (q.DataExportTag) qidToTag.set(qid, q.DataExportTag)

	const blockNameById = new Map<string, string>()
	for (const [blockId, block] of Object.entries(def.Blocks ?? {})) blockNameById.set(block.ID ?? blockId, block.Description ?? blockId)

	// Questions keyed by DataExportTag.
	const questions: Record<string, unknown> = {}
	for (const [qid, q] of Object.entries(def.Questions ?? {})) {
		const tag = q.DataExportTag ?? qid
		const picked: Record<string, unknown> = {}
		for (const [k, v] of Object.entries(q)) if (!DROP_QUESTION_FIELDS.has(k)) picked[k] = v
		questions[tag] = deepNorm(picked, qidToTag)
	}

	// Blocks keyed by name; elements as question tags / page breaks.
	const blocks: Record<string, string[]> = {}
	for (const [blockId, block] of Object.entries(def.Blocks ?? {})) {
		const name = block.Description ?? blockId
		blocks[name] = (block.BlockElements ?? []).map((e) =>
			e.Type === 'Question' && e.QuestionID ? `Q:${qidToTag.get(e.QuestionID) ?? e.QuestionID}` : e.Type
		)
	}

	// Flow: block ids -> names, drop FlowIDs, keep randomizer + embedded data shape.
	interface RawFlowEl {
		Type: string
		ID?: string
		Flow?: RawFlowEl[]
		SubSet?: number
		EvenPresentation?: boolean
		EmbeddedData?: { Field?: string }[]
	}
	const normFlow = (els: RawFlowEl[] | undefined): unknown[] =>
		(els ?? []).map((el) => {
			if (el.Type === 'BlockRandomizer')
				return { Type: 'BlockRandomizer', SubSet: el.SubSet, Even: el.EvenPresentation, Flow: normFlow(el.Flow) }
			if (el.Type === 'EmbeddedData') return { Type: 'EmbeddedData', Fields: (el.EmbeddedData ?? []).map((d) => d.Field) }
			if (el.ID) return { Type: el.Type, Block: blockNameById.get(el.ID) ?? el.ID }
			return { Type: el.Type }
		})

	return sortKeys({
		questionCount: Object.keys(def.Questions ?? {}).length,
		flow: normFlow((def.SurveyFlow?.Flow as RawFlowEl[] | undefined) ?? []),
		blocks,
		questions,
	})
}

fs.mkdirSync(outDir, { recursive: true })

for (const surveyId of ids) {
	const client = new QualtricsClient({ token, datacenter, surveyId })
	const def = await client.getDefinition()
	const file = path.join(outDir, `${surveyId}.json`)
	fs.writeFileSync(file, JSON.stringify(normalize(def), null, 2) + '\n')
	console.error(`wrote ${path.relative(repoRoot, file)} (${Object.keys(def.Questions ?? {}).length} questions)`)
}
