// Validate YAML documents against the repository JSON schemas.
// This replaces ajv-cli so we can keep schema validation without carrying its
// vulnerable fast-json-patch dependency.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import type { AnySchema, ErrorObject } from 'ajv'
import YAML from 'yaml'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const questionsDir = path.join(repoRoot, 'questions')

type Target = 'questions' | 'survey'

function usage(): never {
	console.error('Usage: tsx scripts/validate-schema.ts <questions|survey>')
	process.exit(2)
}

const target = process.argv[2] as Target | undefined
if (target !== 'questions' && target !== 'survey') usage()

function readJson(file: string): unknown {
	return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function readYaml(file: string): unknown {
	return YAML.parse(fs.readFileSync(file, 'utf8'))
}

function formatErrors(errors: ErrorObject[]): string {
	return errors
		.map((error) => {
			const location = error.instancePath || '/'
			return `${location} ${error.message ?? 'is invalid'}`
		})
		.join('; ')
}

function validateFiles(schemaFile: string, files: string[]): void {
	const ajv = new Ajv({ allErrors: true, strict: false })
	const validate = ajv.compile(readJson(schemaFile) as AnySchema)
	let errors = 0

	for (const file of files) {
		const data = readYaml(file)
		if (validate(data)) {
			console.log(`${path.relative(process.cwd(), file)} valid`)
			continue
		}

		errors += 1
		console.error(`${path.relative(process.cwd(), file)} invalid`)
		console.error(formatErrors(validate.errors ?? []))
	}

	if (errors > 0) {
		process.exitCode = 1
	}
}

if (target === 'questions') {
	const files = fs.globSync('*/*.yaml', { cwd: questionsDir }).map((rel) => path.join(questionsDir, rel))
	validateFiles(path.join(questionsDir, 'question.schema.json'), files)
} else {
	validateFiles(path.join(questionsDir, 'survey.schema.json'), [path.join(questionsDir, 'survey.yaml')])
}
