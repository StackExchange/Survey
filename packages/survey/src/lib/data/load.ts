// Bundle every question YAML and the top-level survey.yaml at build time
// (Vite's import.meta.glob with `?raw` gives us the file contents as strings,
// HMR-aware). Parse with the existing `yaml` dependency.
//
// The result is a typed snapshot of the survey + questions. When any source
// file changes, Vite invalidates this module; Svelte components that read
// from it re-render automatically.

import YAML from 'yaml'
import type { Question, Survey } from '$lib/types'

const questionRaws = import.meta.glob<string>('../../../../../questions/**/*.yaml', {
	eager: true,
	query: '?raw',
	import: 'default',
})

const surveyRaws = import.meta.glob<string>('../../../survey.yaml', {
	eager: true,
	query: '?raw',
	import: 'default',
})

function loadQuestions(): Record<string, Question> {
  const out: Record<string, Question> = {}

	for (const [path, raw] of Object.entries(questionRaws)) {
		try {
			const doc = YAML.parse(raw) as { question?: Question }
			if (doc?.question?.id) out[doc.question.id] = doc.question
		} catch (e) {
			console.error(`Failed to parse ${path}:`, e)
		}
  }

	return out
}

function loadSurvey(): Survey {
  const [, raw] = Object.entries(surveyRaws)[0] ?? []

  if (!raw) throw new Error('survey.yaml not found via import.meta.glob')

	return YAML.parse(raw) as Survey
}

export const questions: Record<string, Question> = loadQuestions()
export const survey: Survey = loadSurvey()
