import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { csvParseRows } from 'd3-dsv'
import { camelCase, kebabCase } from 'lodash-es'

// Where to save this
const OUT = path.resolve(fileURLToPath(import.meta.url), '../../survey.json')

// The Copy Spreadsheet - MUST BE SET TO PUBLIC
// https://docs.google.com/spreadsheets/d/[ID FROM HERE]/edit#
const SHEET_ID = process.env.GOOGLE_SHEETS_SHEETID

// Columns with split with `|`
const LISTS = new Set(['dataset', 'values'])

if (!SHEET_ID) throw new Error('GOOGLE_SHEETS_SHEETID is not set — see .env.example')

// Define which tabs we accept
const [settings, chapters, sections, questions, features] = await Promise.all(
	['Settings', 'Chapters', 'Sections', 'Questions', 'Features'].map(getSheet)
)

function mapRow(headers, row) {
	const out = {}

	headers.forEach((header, i) => {
		const key = camelCase(header)
		const raw = (row[i] ?? '').trim()

		if (!key) return
		else if (raw === 'TRUE' || raw === 'FALSE') out[key] = raw === 'TRUE'
		else if (LISTS.has(key)) out[key] = raw ? raw.split('|').map((v) => v.trim()) : []
		else out[key] = raw
	})

	// Kebab the name so it can be an html id, and pre-compute the dataId slug so components never have to
	if (out.name) out.id = kebabCase(out.name)
	if (out.dataId) out.dataIdSlug = kebabCase(out.dataId)

	return out
}

async function getSheet(name) {
	const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(name)}`
	const res = await fetch(url)

	// A private sheet 401s, but a missing tab answers 200 with an HTML error page
	if (!res.ok) throw new Error(`${name}: HTTP ${res.status} — is the sheet shared with "anyone with the link"?`)
	if (!res.headers.get('content-type')?.includes('csv')) throw new Error(`${name}: not CSV — does that tab exist?`)

	// d3-dsv is ragged-tolerant, so Sheets' padded grid needs no options. It does
	// not strip a BOM though, and one would ride into the first header name and
	// camelCase into a key nothing reads — losing that column silently.
	const [headers, ...rows] = csvParseRows((await res.text()).replace(/^\uFEFF/, ''))

	// Sheets pads the grid, so a blank row is all-empty rather than absent.
	return rows.filter((row) => row.some((field) => field !== '')).map((row) => mapRow(headers, row))
}

const byName = new Map(chapters.map((chapter) => [chapter.name, chapter]))
const dropped = []

for (const section of sections) {
	const chapter = byName.get(section.chapter)
	if (chapter) (chapter.sections ??= []).push(section)
	else dropped.push(`section "${section.name}" — no chapter "${section.chapter}"`)
}

for (const question of questions) {
	const section = byName.get(question.chapter)?.sections?.find((s) => s.name === question.section)
	if (section) (section.questions ??= []).push(question)
	else dropped.push(`question "${question.name}" — no section "${question.chapter} / ${question.section}"`)
}

for (const feature of features) {
	const chapter = byName.get(feature.chapter)
	if (chapter) (chapter.features ??= []).push(feature)
	else dropped.push(`${feature.tier} "${feature.headline}" — no chapter "${feature.chapter}"`)
}

// Position is the chapter's own, so it belongs with the chapter rather than being
// recomputed by every consumer. 1-based, for the section numbering on data pages.
chapters.forEach((chapter, i) => (chapter.index = i + 1))

// The `settings` tab is a Name/Value store rather than a table, so it misses the
// TRUE/FALSE coercion in mapRow — do it here so flags read as booleans.
const survey = {
	settings: Object.fromEntries(settings.map((r) => [camelCase(r.name), r.value === 'TRUE' ? true : r.value === 'FALSE' ? false : r.value])),
	chapters,
}

// Written before the exit below, so a bad pull is still there to look at.
await fs.writeFile(OUT, `${JSON.stringify(survey, null, 2)}\n`)

for (const row of dropped) console.error(`✕ dropped ${row}`)

console.error(
	`✅ ${chapters.length} chapters, ${sections.length} sections, ${questions.length} questions, ${features.length} features → survey.json`
)

// A drop means two tabs disagree about a name, which is always a mistake in the
// sheet — and the site it builds is missing that row without saying so. Exiting
// non-zero stops `content && data` here rather than at a blank page.
if (dropped.length) {
	console.error(`\n✕ ${dropped.length} row(s) dropped — fix the sheet and pull again`)
	process.exitCode = 1
}
