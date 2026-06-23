#!/usr/bin/env tsx
// Sync the YAML survey source into an EXISTING Qualtrics survey.
//
// Strategy: idempotent upsert keyed on DataExportTag (== question.id == file
// name). Questions present in YAML but not in the survey are created; ones in
// both are updated only when their content changed; ones in the survey but not
// in YAML are reported as orphans and deleted only under --prune. Qualtrics
// QIDs are preserved across runs, so a re-run with no edits is a no-op.
//
// Scope: questions + blocks + page breaks + per-question DisplayLogic (the
// if/then branching from survey.yaml, AND-ing ancestor conditions) + the survey
// flow (block order + randomize:N/even_presentation BlockRandomizer, preserving
// any existing EmbeddedData).
//
// Config comes from the environment:
//   QUALTRICS_API_TOKEN   X-API-TOKEN for the Survey Definitions API
//   QUALTRICS_DATACENTER  e.g. iad1, fra1, syd1
//   QUALTRICS_SURVEY_ID   target existing survey, e.g. SV_xxxxx
//
// Usage:
//   tsx scripts/qualtrics-sync.ts [--dry-run] [--prune] [--verbose] [--force-display-logic]
//   --dry-run              read-only GET + full reconcile, print WOULD-write actions
//   --prune                allow deleting questions/blocks that are gone from YAML
//   --verbose              print per-question decisions
//   --force-display-logic  overwrite all YAML-managed DisplayLogic, even when signatures match
// With no QUALTRICS_API_TOKEN, runs offline: prints the transformed payloads
// only (no network), so the transforms can be eyeballed without credentials.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'
import {
	QualtricsClient,
	answerKey,
	buildDisplayLogic,
	createSafePayload,
	displayLogicSignature,
	optionKey,
	questionSignature,
	signaturesEqual,
	toQuestionPayload,
} from './qualtrics.ts'
import type { ChoiceResolver, QualtricsConfig, QualtricsFlowElement, QualtricsQuestionPayload, SurveyDefinition } from './qualtrics.ts'
import type { Condition, FlowElement, PageEntry, Question, Survey } from '../src/lib/types/index.ts'

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

// --- flatten the flow into blocks -----------------------------------------

interface DesiredBlock {
	name: string
	// Each inner array is one page (ids shown together); page breaks go between.
	pageGroups: string[][]
}

// AND a parent if-condition with an inner one. Matches the README: a nested
// page is shown only when every ancestor branch passes.
function andConditions(parent: Condition | undefined, inner: Condition): Condition {
	if (!parent) return inner
	return { all: [parent, inner] }
}

// Walk page entries; carry the accumulated if-condition down so each question
// id records the condition under which it is shown (in `conds`).
function flattenPageEntries(entries: PageEntry[], cond: Condition | undefined, conds: Map<string, Condition>): string[][] {
	const groups: string[][] = []
	for (const e of entries) {
		if (typeof e === 'string') {
			groups.push([e])
			if (cond) conds.set(e, cond)
		} else if (Array.isArray(e)) {
			groups.push([...e])
			if (cond) for (const id of e) conds.set(id, cond)
		} else {
			groups.push(...flattenPageEntries(e.then, andConditions(cond, e.if), conds))
		}
	}
	return groups
}

function collectBlocks(flow: FlowElement[], out: DesiredBlock[], conds: Map<string, Condition>, cond?: Condition): void {
	for (const el of flow) {
		if ('block' in el) {
			out.push({ name: el.block, pageGroups: flattenPageEntries(el.pages, cond, conds) })
		} else if ('randomize' in el) {
			collectBlocks(el.blocks, out, conds, cond)
		} else {
			// Flow-level if/then: AND the condition onto every question in `then`.
			collectBlocks(el.then, out, conds, andConditions(cond, el.if))
		}
	}
}

// --- flow structure (block order + BlockRandomizer) -----------------------

type FlowNode = { kind: 'block'; name: string } | { kind: 'randomizer'; subset: number; even: boolean; blocks: string[] }

// Block names in order, recursing through if/then and nested randomizers.
function blockNamesIn(flow: FlowElement[]): string[] {
	const names: string[] = []
	for (const el of flow) {
		if ('block' in el) names.push(el.block)
		else if ('randomize' in el) names.push(...blockNamesIn(el.blocks))
		else names.push(...blockNamesIn(el.then))
	}
	return names
}

// Top-level flow shape: a sequence of blocks and BlockRandomizers. Flow-level
// if/then wrappers contribute their blocks inline (their visibility is handled
// by per-question DisplayLogic, not the flow).
function collectFlowNodes(flow: FlowElement[]): FlowNode[] {
	const nodes: FlowNode[] = []
	for (const el of flow) {
		if ('block' in el) nodes.push({ kind: 'block', name: el.block })
		else if ('randomize' in el)
			nodes.push({ kind: 'randomizer', subset: el.randomize, even: el.even_presentation ?? false, blocks: blockNamesIn(el.blocks) })
		else nodes.push(...collectFlowNodes(el.then))
	}
	return nodes
}

// --- CLI / config -------------------------------------------------------

interface Flags {
	dryRun: boolean
	prune: boolean
	verbose: boolean
	forceDisplayLogic: boolean
}

function parseFlags(argv: string[]): Flags {
	return {
		dryRun: argv.includes('--dry-run'),
		prune: argv.includes('--prune'),
		verbose: argv.includes('--verbose'),
		forceDisplayLogic: argv.includes('--force-display-logic'),
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

function runOffline(
	questions: Record<string, Question>,
	desiredBlocks: DesiredBlock[],
	conds: Map<string, Condition>,
	flowNodes: FlowNode[],
	aiTextChecks: unknown
): void {
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
				console.log(JSON.stringify(toQuestionPayload(q, aiTextChecks, { questions }), null, 2))
			}
		}
	}

	// DisplayLogic preview. Offline we have no QIDs, so stand in the parent id
	// for the QID; positions and structure are still real.
	const offlineResolve: ChoiceResolver = (parentId, key, matrixAnswerKey) => {
		const parent = questions[parentId]
		const idx = (parent?.options ?? []).findIndex((o) => optionKey(o) === key)
		const answerIdx = matrixAnswerKey
			? (questions[parentId]?.scale?.columns ?? []).findIndex((col) => answerKey(col) === matrixAnswerKey)
			: -1
		const pos = parent?.type === 'nps' ? Number(key) : idx + 1
		return { qid: parentId, pos, answerPos: matrixAnswerKey ? answerIdx + 1 : undefined }
	}
	console.log('\n# DisplayLogic (parent id stands in for QID)')
	for (const [id, condition] of conds) {
		try {
			console.log(`## ${id}\n` + JSON.stringify(buildDisplayLogic(condition, offlineResolve, id), null, 2))
		} catch (e) {
			console.error(`  ✗ ${id}: ${e instanceof Error ? e.message : String(e)}`)
		}
	}

	console.log('\n# Flow\n' + describeFlow(flowNodes))
}

function describeFlow(flowNodes: FlowNode[]): string {
	return flowNodes
		.map((nd) => (nd.kind === 'block' ? nd.name : `Randomize(${nd.subset}, even=${nd.even}) of [${nd.blocks.join(', ')}]`))
		.join('\n')
}

// --- reconcile ----------------------------------------------------------

interface Counters {
	created: number
	updated: number
	unchanged: number
	orphanedKept: number
	orphanedDeleted: number
	logicSet: number
	logicUnchanged: number
	flow: string
	survey: { id: string; name: string; status: string; lastModified: string; brandId: string }
	failures: { id: string; kind: string; message: string }[]
}

async function reconcile(
	client: QualtricsClient,
	flags: Flags,
	questions: Record<string, Question>,
	desiredBlocks: DesiredBlock[],
	conds: Map<string, Condition>,
	flowNodes: FlowNode[],
	aiTextChecks: unknown
): Promise<Counters> {
	const counts: Counters = {
		created: 0,
		updated: 0,
		unchanged: 0,
		orphanedKept: 0,
		orphanedDeleted: 0,
		logicSet: 0,
		logicUnchanged: 0,
		flow: 'n/a',
		survey: { id: '', name: '', status: '', lastModified: '', brandId: '' },
		failures: [],
	}
	const def: SurveyDefinition = await client.getDefinition()
	counts.survey = {
		id: def.SurveyID ?? '',
		name: def.SurveyName ?? '',
		status: def.SurveyStatus ?? '',
		lastModified: def.LastModified ?? '',
		brandId: def.BrandID ?? '',
	}

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
	for (const [tag, { qid }] of existingByTag) qidByTag.set(tag, qid)
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
				const existing = existingByTag.get(id)
				const payload = toQuestionPayload(q, aiTextChecks, { questions, qidByTag })
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

	// If a question moved between blocks, Qualtrics can leave the old block
	// reference around. Remove synced questions from blocks that are no longer
	// represented by survey.yaml before writing the desired block elements.
	const desiredBlockNames = new Set(desiredBlocks.map((block) => block.name))
	const desiredQids = new Set([...desiredTags].map((tag) => qidByTag.get(tag)).filter((qid): qid is string => !!qid))
	for (const [blockId, block] of Object.entries(def.Blocks ?? {})) {
		const name = block.Description ?? blockId
		if (desiredBlockNames.has(name)) continue
		const elements = block.BlockElements ?? []
		const cleaned = elements.filter((el) => !(el.Type === 'Question' && el.QuestionID && desiredQids.has(el.QuestionID)))
		if (cleaned.length === elements.length) continue
		if (flags.dryRun) would(`remove moved YAML questions from stale block "${name}"`)
		else await client.updateBlock(block.ID ?? blockId, { Type: block.Type ?? 'Standard', Description: name, BlockElements: cleaned })
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

	// 3b. Branching: stamp per-question DisplayLogic from accumulated if/then
	//     conditions. Runs after the upsert so every parent QID is resolvable.
	const resolveChoice: ChoiceResolver = (parentId, key, matrixAnswerKey) => {
		const qid = qidByTag.get(parentId)
		if (!qid) throw new Error(`references parent "${parentId}" which was not synced`)
		const pq = questions[parentId]
		if (!pq) throw new Error(`references parent "${parentId}" with no question file`)
		const idx = (pq.options ?? []).findIndex((o) => optionKey(o) === key)
		if (idx < 0) throw new Error(`references option "${key}" not found on "${parentId}"`)
		if (!matrixAnswerKey) return { qid, pos: pq.type === 'nps' ? Number(key) : idx + 1 }

		const answerIdx = (pq.scale?.columns ?? []).findIndex((col) => answerKey(col) === matrixAnswerKey)
		if (answerIdx < 0) throw new Error(`references matrix column "${matrixAnswerKey}" not found on "${parentId}"`)
		return { qid, pos: idx + 1, answerPos: answerIdx + 1 }
	}

	for (const [id, condition] of conds) {
		if (!desiredTags.has(id)) continue
		const qid = qidByTag.get(id)
		if (!qid) continue
		let dl
		try {
			dl = buildDisplayLogic(condition, resolveChoice, id)
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			counts.failures.push({ id, kind: 'DisplayLogic', message })
			console.error(`  ✗ ${id} (DisplayLogic): ${message}`)
			continue
		}
		const existingDL = qid.startsWith('NEW:') ? undefined : def.Questions[qid]?.DisplayLogic
		if (!flags.forceDisplayLogic && displayLogicSignature(dl) === displayLogicSignature(existingDL)) {
			counts.logicUnchanged++
			continue
		}
		if (flags.dryRun) {
			would(`set display logic on "${id}" (${qid})`)
		} else {
			try {
				const payload = toQuestionPayload(questions[id], aiTextChecks, { questions, qidByTag })
				payload.DisplayLogic = dl
				await client.updateQuestion(qid, payload)
				log(`  ⊃ ${id} display logic (${qid})`)
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e)
				counts.failures.push({ id, kind: 'DisplayLogic', message })
				console.error(`  ✗ ${id} (DisplayLogic PUT): ${message.split('\n')[0].slice(0, 280)}`)
				continue
			}
		}
		counts.logicSet++
	}

	// 4. Flow: rebuild block order + BlockRandomizer, preserving EmbeddedData.
	counts.flow = await syncFlow(client, flags, def, flowNodes, blockIdByName, would, log)

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

	return counts
}

// Rebuild the survey flow from survey.yaml: block order + BlockRandomizer,
// while preserving any element we don't model (EmbeddedData, Branch, etc.) in
// its original position. Idempotent — re-PUTs only when the block-name order or
// randomizer structure changed.
const FLOW_BLOCK_TYPES = new Set(['Block', 'Standard', 'BlockRandomizer'])

async function syncFlow(
	client: QualtricsClient,
	flags: Flags,
	def: SurveyDefinition,
	flowNodes: FlowNode[],
	blockIdByName: Map<string, string>,
	would: (m: string) => void,
	log: (m: string) => void
): Promise<string> {
	const flow = def.SurveyFlow
	if (!flow?.Flow) {
		console.error('  ! survey has no readable SurveyFlow; skipping flow update (verify survey state)')
		return 'skipped'
	}

	const nameById = new Map<string, string>()
	for (const [blockId, block] of Object.entries(def.Blocks ?? {})) nameById.set(block.ID ?? blockId, block.Description ?? blockId)

	// Next FlowID number above the existing max, so preserved elements keep theirs.
	let maxN = 0
	const scan = (els: QualtricsFlowElement[]) => {
		for (const el of els) {
			const m = /^FL_(\d+)$/.exec(el.FlowID ?? '')
			if (m) maxN = Math.max(maxN, Number(m[1]))
			if (el.Flow) scan(el.Flow)
		}
	}
	scan(flow.Flow)
	let n = maxN + 1
	const fid = () => `FL_${n++}`

	const blockRef = (name: string): QualtricsFlowElement => ({ Type: 'Standard', ID: blockIdByName.get(name)!, FlowID: fid(), Autofill: [] })
	const built: QualtricsFlowElement[] = flowNodes.map((node) =>
		node.kind === 'block'
			? blockRef(node.name)
			: { Type: 'BlockRandomizer', FlowID: fid(), SubSet: node.subset, EvenPresentation: node.even, Flow: node.blocks.map(blockRef) }
	)

	const preserved = flow.Flow.filter((el) => !FLOW_BLOCK_TYPES.has(el.Type))
	const desired = [...preserved, ...built]

	// Compare by block-name order + randomizer shape, ignoring volatile FlowIDs.
	const sig = (els: QualtricsFlowElement[]): string =>
		els
			.map((el) =>
				el.Type === 'BlockRandomizer'
					? `R:${el.SubSet}:${el.EvenPresentation}:[${(el.Flow ?? []).map((c) => nameById.get(c.ID ?? '') ?? c.ID).join(',')}]`
					: FLOW_BLOCK_TYPES.has(el.Type)
						? `B:${nameById.get(el.ID ?? '') ?? el.ID}`
						: el.Type
			)
			.join('|')

	if (flags.dryRun) {
		would(`replace survey flow: ${describeFlow(flowNodes).replace(/\n/g, ' -> ')}`)
		return 'dry-run'
	}
	if (sig(desired) === sig(flow.Flow)) {
		log('  flow unchanged')
		return 'unchanged'
	}
	await client.updateFlow({ ...flow, Flow: desired })
	log(`  flow updated (${built.length} top-level elements)`)
	return 'updated'
}

// --- main ---------------------------------------------------------------

async function main(): Promise<void> {
	const flags = parseFlags(process.argv.slice(2))
	const questions = loadQuestions()
	const survey = loadSurvey()
	const aiTextChecks = (survey as { defaults?: { ai_text_checks?: unknown } }).defaults?.ai_text_checks

	const desiredBlocks: DesiredBlock[] = []
	const conds = new Map<string, Condition>()
	collectBlocks(survey.flow, desiredBlocks, conds)
	const flowNodes = collectFlowNodes(survey.flow)

	const config = readConfig()
	if (!config) {
		runOffline(questions, desiredBlocks, conds, flowNodes, aiTextChecks)
		return
	}

	const client = new QualtricsClient(config)
	const counts = await reconcile(client, flags, questions, desiredBlocks, conds, flowNodes, aiTextChecks)

	printSummary(counts, config, flags)
}

function printSummary(counts: Counters, config: QualtricsConfig, flags: Flags): void {
	const s = counts.survey
	const id = s.id || config.surveyId
	// Builder URL is {brand}.{datacenter}.qualtrics.com, e.g. stackoverflow.pdx1.
	const host = `${s.brandId ? `${s.brandId}.` : ''}${config.datacenter}.qualtrics.com`
	const when = s.lastModified ? s.lastModified.replace('T', ' ').replace('Z', ' UTC') : 'unknown'
	const subtitle = [id, s.status, `modified ${when}`].filter(Boolean).join('  ·  ')
	const rule = '─'.repeat(68)

	const rows: [string, string][] = [
		['Questions', `${counts.created} created · ${counts.updated} updated · ${counts.unchanged} unchanged`],
		['Display logic', `${counts.logicSet} set · ${counts.logicUnchanged} unchanged`],
		['Flow', counts.flow],
		['Orphaned', `${counts.orphanedKept + counts.orphanedDeleted} (${counts.orphanedDeleted} deleted)`],
		['Failed', String(counts.failures.length)],
	]

	const out = [
		'',
		rule,
		`  ${s.name || '(unnamed survey)'}${flags.dryRun ? '   — dry-run, no changes written' : ''}`,
		`  ${subtitle}`,
		rule,
		`  https://${host}/survey-builder/${id}/edit`,
		rule,
		...rows.map(([label, value]) => `  ${label.padEnd(15)}${value}`),
		rule,
	]
	console.error(out.join('\n'))

	if (counts.failures.length > 0) {
		console.error('\nfailures (grouped by question type):')
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
