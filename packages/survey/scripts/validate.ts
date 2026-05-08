#!/usr/bin/env tsx
// Cross-cutting checks that JSON Schema can't express.
// Schema validation itself runs via ajv-cli (see package.json scripts).
//
// TODO: show_if reference resolution
// TODO: flow → question existence
// TODO: deprecation warnings

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..', '..')
const questionsDir = path.join(repoRoot, 'questions')

interface QuestionDoc {
	question?: { id?: string }
}

let errors = 0
const files = fs.globSync('**/*.yaml', { cwd: questionsDir })

for (const rel of files) {
	const expected = path.basename(rel, '.yaml')
	let id: string | undefined

	try {
		const doc = YAML.parse(fs.readFileSync(path.join(questionsDir, rel), 'utf8')) as QuestionDoc
		id = doc?.question?.id
	} catch (e) {
		console.error(`  ${rel}: parse error: ${(e as Error).message}`)
		errors++
		continue
	}
	if (id !== expected) {
		console.error(`  ${rel}: id "${id}" doesn't match filename "${expected}"`)
		errors++
	}
}

if (errors > 0) {
	console.error(`\n${errors} cross-question error(s).`)
	process.exit(1)
}

console.error(`OK — cross-question checks passed (${files.length} files).`)
