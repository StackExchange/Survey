#!/usr/bin/env tsx
// Sync the YAML survey source into an EXISTING Qualtrics survey.
//
// Strategy: idempotent upsert keyed on DataExportTag (== question.id == file
// name). Questions present in YAML but not in the survey are created; ones in
// both are updated only when their content changed; ones in the survey but not
// in YAML are reported as orphans and deleted only under --prune. Qualtrics
// QIDs are preserved across runs, so a re-run with no edits is a no-op.
//
// Phase 1 scope: questions + blocks + page breaks + ensuring every block is
// reachable from the flow. The if/then branching and randomize:N
// BlockRandomizer in survey.yaml are printed but NOT pushed (see Phase 2 in
// the plan); this script never rewrites existing flow logic, only appends
// missing blocks.
//
// Config comes from the environment:
//   QUALTRICS_API_TOKEN   X-API-TOKEN for the Survey Definitions API
//   QUALTRICS_DATACENTER  e.g. iad1, fra1, syd1
//   QUALTRICS_SURVEY_ID   target existing survey, e.g. SV_xxxxx
//
// Usage:
//   tsx scripts/qualtrics-sync.ts [--dry-run] [--prune] [--verbose]
//   --dry-run  read-only GET + full reconcile, print WOULD-write actions
//   --prune    allow deleting questions/blocks that are gone from YAML
//   --verbose  print per-question decisions
// With no QUALTRICS_API_TOKEN, runs offline: prints the transformed payloads
// only (no network), so the transforms can be eyeballed without credentials.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'
import { QualtricsClient, createSafePayload, questionSignature, signaturesEqual, toQuestionPayload } from './qualtrics.ts'
import type { QualtricsConfig, QualtricsQuestionPayload, SurveyDefinition } from './qualtrics.ts'
import type { FlowElement, PageEntry, Question, Survey } from '../src/lib/types/index.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const questionsDir = path.join(repoRoot, 'questions')

// --- load YAML ----------------------------------------------------------

function loadQuestions(): Record<string, Question> {
	const out: Record<string, Question> = {}

	for (const rel of fs.globSync('*/*.yaml', { cwd: questionsDir })) {
		const doc = YAML.parse(fs.readFileSync(path.join(questionsDir, rel), 'utf8')) as { question?: Question }
		if (doc?.question?.id) out[doc.question.id] = doc.question
	}

	return out
}

function loadSurvey(): Survey {
	return YAML.parse(fs.readFileSync(path.join(questionsDir, 'survey.yaml'), 'utf8')) as Survey
}

// --- flatten the flow into blocks (Phase 1) -----------------------------

interface DesiredBlock {
	name: string
	// Each inner array is one page (ids shown together); page breaks go between.
	pageGroups: string[][]
}

function flattenPageEntries(entries: PageEntry[], notes: Set<string>): string[][] {
	const groups: string[][] = []
	for (const e of entries) {
		if (typeof e === 'string') groups.push([e])
		else if (Array.isArray(e)) groups.push([...e])
		else {
			notes.add('page-level branch (if/then) — visibility logic not synced in Phase 1')
			groups.push(...flattenPageEntries(e.then, notes))
		}
	}
	return groups
}

function collectBlocks(flow: FlowElement[], notes: Set<string>, out: DesiredBlock[]): void {
	for (const el of flow) {
		if ('block' in el) {
			out.push({ name: el.block, pageGroups: flattenPageEntries(el.pages, notes) })
		} else if ('randomize' in el) {
			notes.add(`BlockRandomizer (randomize: ${el.randomize}, even_presentation: ${el.even_presentation ?? false}) — not synced in Phase 1`)
			collectBlocks(el.blocks, notes, out)
		} else {
			notes.add('flow-level branch (if/then) — not synced in Phase 1')
			collectBlocks(el.then, notes, out)
		}
	}
}

// --- CLI / config -------------------------------------------------------

interface Flags {
	dryRun: boolean
	prune: boolean
	verbose: boolean
}

function parseFlags(argv: string[]): Flags {
	return {
		dryRun: argv.includes('--dry-run'),
		prune: argv.includes('--prune'),
		verbose: argv.includes('--verbose'),
	}
}

function readConfig(): QualtricsConfig | undefined {
	const token = process.env.QUALTRICS_API_TOKEN
	const datacenter = process.env.QUALTRICS_DATACENTER
	const surveyId = process.env.QUALTRICS_SURVEY_ID

	if (!token) return undefined

	if (!datacenter || !surveyId) {
		console.error('QUALTRICS_API_TOKEN is set but QUALTRICS_DATACENTER and/or QUALTRICS_SURVEY_ID are missing.')
		process.exit(2)
	}
	return { token, datacenter, surveyId }
}

// --- offline mode: print transforms only --------------------------------

function runOffline(questions: Record<string, Question>, desiredBlocks: DesiredBlock[], notes: Set<string>, aiTextChecks: unknown): void {
	console.error('No QUALTRICS_API_TOKEN set — offline transform preview (no network).\n')
	for (const block of desiredBlocks) {
		console.log(`# Block: ${block.name}`)
		for (const group of block.pageGroups) {
			for (const id of group) {
				const q = questions[id]
				if (!q) {
					console.error(`  ! ${id}: referenced in flow but no question file found`)
					continue
				}
				console.log(JSON.stringify(toQuestionPayload(q, aiTextChecks), null, 2))
			}
		}
	}
	printNotes(notes)
}

function printNotes(notes: Set<string>): void {
	if (notes.size === 0) return
	console.error('\nPhase 2 (not synced yet):')
	for (const n of notes) console.error(`  - ${n}`)
}

// --- reconcile ----------------------------------------------------------

interface Counters {
	created: number
	updated: number
	unchanged: number
	orphanedKept: number
	orphanedDeleted: number
	failures: { id: string; kind: string; message: string }[]
}

async function reconcile(
	client: QualtricsClient,
	flags: Flags,
	questions: Record<string, Question>,
	desiredBlocks: DesiredBlock[],
	notes: Set<string>,
	aiTextChecks: unknown
): Promise<Counters> {
	const counts: Counters = { created: 0, updated: 0, unchanged: 0, orphanedKept: 0, orphanedDeleted: 0, failures: [] }
	const def: SurveyDefinition = await client.getDefinition()

	// Index existing questions by DataExportTag, and blocks by Description (name).
	const existingByTag = new Map<string, { qid: string }>()
	for (const [qid, q] of Object.entries(def.Questions ?? {})) {
		if (q.DataExportTag) existingByTag.set(q.DataExportTag, { qid })
	}
	const blockIdByName = new Map<string, string>()
	for (const [blockId, block] of Object.entries(def.Blocks ?? {})) {
		if (block.Description) blockIdByName.set(block.Description, block.ID ?? blockId)
	}

	const log = (msg: string) => flags.verbose && console.error(msg)
	const would = (msg: string) => console.error(`[dry-run] WOULD ${msg}`)

	// 1. Ensure blocks exist (need their IDs before creating questions).
	for (const block of desiredBlocks) {
		if (blockIdByName.has(block.name)) continue
		if (flags.dryRun) {
			would(`POST block "${block.name}"`)
			blockIdByName.set(block.name, `NEW_BLOCK:${block.name}`)
		} else {
			const res = await client.createBlock({ Type: 'Standard', Description: block.name })
			blockIdByName.set(block.name, res.BlockID)
			log(`  + block "${block.name}" (${res.BlockID})`)
		}
	}

	// 2. Upsert questions (create into home block, or update in place).
	const desiredTags = new Set<string>()
	const qidByTag = new Map<string, string>()
	for (const block of desiredBlocks) {
		const blockId = blockIdByName.get(block.name)!
		for (const group of block.pageGroups) {
			for (const id of group) {
				const q = questions[id]
				if (!q) {
					console.error(`  ! ${id}: referenced in flow but no question file found — skipping`)
					continue
				}
				desiredTags.add(id)
				const payload = toQuestionPayload(q, aiTextChecks)
				const existing = existingByTag.get(id)
				const kind = [payload.QuestionType, payload.Selector, payload.SubSelector].filter(Boolean).join('/')

				try {
					if (!existing) {
						if (flags.dryRun) {
							would(`create question "${id}" in block "${block.name}"`)
							qidByTag.set(id, `NEW:${id}`)
						} else {
							const res = await client.createQuestion(blockId, createSafePayload(payload))
							await client.updateQuestion(res.QuestionID, payload)
							qidByTag.set(id, res.QuestionID)
							log(`  + ${id} (${res.QuestionID})`)
						}
						counts.created++
						continue
					}

					qidByTag.set(id, existing.qid)
					const changed = !signaturesEqual(
						questionSignature(payload as QualtricsQuestionPayload),
						questionSignature(def.Questions[existing.qid])
					)
					if (!changed) {
						counts.unchanged++
						log(`  = ${id} (${existing.qid})`)
						continue
					}
					if (flags.dryRun) would(`update question "${id}" (${existing.qid})`)
					else {
						await client.updateQuestion(existing.qid, payload)
						log(`  ~ ${id} (${existing.qid})`)
					}
					counts.updated++
				} catch (e) {
					// Don't abort the whole run on one bad question — record it and
					// keep going so a single run surfaces every problem type.
					const message = e instanceof Error ? e.message : String(e)
					counts.failures.push({ id, kind, message })
					console.error(`  ✗ ${id} (${kind}): ${message.split('\n')[0].slice(0, 280)}`)
				}
			}
		}
	}

	// 3. Set each block's elements: question order + page breaks between pages.
	for (const block of desiredBlocks) {
		const blockId = blockIdByName.get(block.name)!
		const elements: { Type: string; QuestionID?: string }[] = []
		block.pageGroups.forEach((group, gi) => {
			if (gi > 0) elements.push({ Type: 'Page Break' })
			for (const id of group) {
				const qid = qidByTag.get(id)
				if (qid) elements.push({ Type: 'Question', QuestionID: qid })
			}
		})
		if (flags.dryRun) would(`set ${elements.length} elements on block "${block.name}"`)
		else await client.updateBlock(blockId, { Type: 'Standard', Description: block.name, BlockElements: elements })
	}

	// 4. Ensure every managed block is reachable from the flow (append-only;
	//    never rewrite existing flow logic — that's Phase 2).
	await ensureBlocksInFlow(client, flags, def, desiredBlocks, blockIdByName, would, log)

	// 5. Orphans: present in survey, gone from YAML.
	for (const [tag, { qid }] of existingByTag) {
		if (desiredTags.has(tag)) continue
		if (flags.prune) {
			if (flags.dryRun) would(`DELETE orphan question "${tag}" (${qid})`)
			else {
				await client.deleteQuestion(qid)
				log(`  - ${tag} (${qid})`)
			}
			counts.orphanedDeleted++
		} else {
			console.error(`  orphan (kept; use --prune to delete): "${tag}" (${qid})`)
			counts.orphanedKept++
		}
	}

	printNotes(notes)
	return counts
}

async function ensureBlocksInFlow(
	client: QualtricsClient,
	flags: Flags,
	def: SurveyDefinition,
	desiredBlocks: DesiredBlock[],
	blockIdByName: Map<string, string>,
	would: (m: string) => void,
	log: (m: string) => void
): Promise<void> {
	const flow = def.Flow

	if (!flow?.Flow) {
		console.error('  ! survey has no readable Flow; skipping flow update (verify survey state)')
		return
	}

	const inFlow = new Set<string>()

	const walk = (els: typeof flow.Flow) => {
		for (const el of els) {
			if (el.ID) inFlow.add(el.ID)
			if (el.Flow) walk(el.Flow)
		}
	}

	walk(flow.Flow)

	const toAppend = desiredBlocks
		.map((b) => ({ name: b.name, id: blockIdByName.get(b.name)! }))
		.filter((b) => !b.id.startsWith('NEW_BLOCK:') && !inFlow.has(b.id))

	if (toAppend.length === 0) return

	for (const b of toAppend) {
		if (flags.dryRun) would(`append block "${b.name}" (${b.id}) to flow`)
		else log(`  flow += "${b.name}" (${b.id})`)
	}

	if (flags.dryRun) return

	let nextFlowNum = flow.Flow.length + 1

	const appended = toAppend.map((b) => ({ Type: 'Block', ID: b.id, FlowID: `FL_${nextFlowNum++}` }))
	await client.updateFlow({ ...flow, Flow: [...flow.Flow, ...appended] })
}

// --- main ---------------------------------------------------------------

async function main(): Promise<void> {
	const flags = parseFlags(process.argv.slice(2))
	const questions = loadQuestions()
	const survey = loadSurvey()
	const aiTextChecks = (survey as { defaults?: { ai_text_checks?: unknown } }).defaults?.ai_text_checks

	const notes = new Set<string>()
	const desiredBlocks: DesiredBlock[] = []
	collectBlocks(survey.flow, notes, desiredBlocks)

	const config = readConfig()
	if (!config) {
		runOffline(questions, desiredBlocks, notes, aiTextChecks)
		return
	}

	const client = new QualtricsClient(config)
	const counts = await reconcile(client, flags, questions, desiredBlocks, notes, aiTextChecks)

	const mode = flags.dryRun ? '[dry-run] ' : ''

	console.error(
		`\n${mode}done — created ${counts.created}, updated ${counts.updated}, unchanged ${counts.unchanged}, ` +
			`orphaned ${counts.orphanedKept + counts.orphanedDeleted} (deleted ${counts.orphanedDeleted}), ` +
			`failed ${counts.failures.length}.`
	)

	if (counts.failures.length > 0) {
		console.error('\nFailures (grouped by question type):')
		const byKind = new Map<string, string[]>()
		for (const f of counts.failures) byKind.set(f.kind, [...(byKind.get(f.kind) ?? []), f.id])
		for (const [kind, ids] of byKind) console.error(`  ${kind}: ${ids.join(', ')}`)
		console.error(`\nfirst error: ${counts.failures[0].message}`)
		process.exitCode = 1
	}
}

main().catch((err: unknown) => {
	console.error(err instanceof Error ? err.message : String(err))
	process.exit(1)
})
