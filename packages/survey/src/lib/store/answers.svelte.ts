// Centralised answer state. Question components write here on input;
// the flow walker and condition evaluator read here to decide visibility.
// Persists to sessionStorage so answers survive HMR full reloads (when a
// YAML edit invalidates the data module and Vite reloads the page) and
// manual refreshes during preview.

import type { Answer } from '$lib/types'

const STORAGE_KEY = 'devsurvey-preview-answers'

function load(): Record<string, Answer> {
	if (typeof sessionStorage === 'undefined') return {}
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY)
		return raw ? (JSON.parse(raw) as Record<string, Answer>) : {}
	} catch {
		return {}
	}
}

function save(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
	} catch {
		// quota / serialisation failure — ignore, the preview still works
	}
}

export const answers = $state<Record<string, Answer>>(load())

export function reset(): void {
	for (const k of Object.keys(answers)) delete answers[k]
	save()
}

export function setAnswer(id: string, value: Answer): void {
	if (value === undefined) {
		delete answers[id]
	} else {
		answers[id] = value
	}
	save()
}
