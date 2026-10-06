import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { generate } from './data.js'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')
const readJson = async (path) => JSON.parse(await read(path))

test('community write-ins stay sampled in route payloads while the full archive is preserved', async () => {
	const survey = await readJson('../survey.json')
	const archive = `../../archive/${survey.settings.year}/json/`
	const chapterBefore = await read(`${archive}community.json`)
	const fullBefore = await read(`${archive}community_SOChangeAddl.json`)
	const source = JSON.parse(chapterBefore)
	const full = JSON.parse(fullBefore).SOChangeAddl

	await generate()

	const chapter = await readJson('../src/generated/data/community.json')
	const question = (await readJson('../src/generated/question/community/so-change-addl.json')).question
	const embedded = chapter.sections.flatMap((section) => section.questions).find((q) => q.dataId === 'SOChangeAddl')

	assert.deepEqual(embedded.demographics, question.demographics, 'both pages must use the same sample')
	assert.equal(question.sampled, true)
	assert.equal(embedded.sampled, true)

	for (const [at, group] of question.demographics.entries()) {
		const rows = source.SOChangeAddl.data.filter((row) => row.slice === at)
		assert.equal(group.data.length, Math.min(500, rows.length))
		assert.equal(group.demographic.n, source.SOChangeAddl.meta.slices[at].n, 'retain the total respondent count')
		const originals = new Set(full.data.filter((row) => row.slice === at).map((row) => JSON.stringify([row.response, row.value])))
		for (const row of group.data) {
			assert.ok(originals.has(JSON.stringify([row.response, row.value])), 'preserve each sampled comment and attribution')
		}
	}

	for (const q of chapter.sections.flatMap((section) => section.questions).filter((q) => q.chart !== 'quotes')) {
		for (const [at, group] of q.demographics.entries()) {
			assert.equal(group.data.length, source[q.dataId].data.filter((row) => row.slice === at).length, q.dataId)
		}
	}

	assert.equal((await generate()).changed, 0, 'unchanged inputs must produce identical payloads')
	assert.equal(await read(`${archive}community.json`), chapterBefore)
	assert.equal(await read(`${archive}community_SOChangeAddl.json`), fullBefore)
})
