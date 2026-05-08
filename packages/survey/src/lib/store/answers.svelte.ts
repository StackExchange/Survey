// Centralised answer state. Question components write here on input;
// the flow walker and show_if evaluator read here to decide visibility.
//
// Persists to sessionStorage so answers (and the current page index)
// survive HMR full reloads (when a YAML edit invalidates the data module
// and Vite reloads the page) and manual refreshes during preview.

import type { Answer } from '$lib/types'

const STORAGE_KEY = 'devsurvey-preview-answers'
const INDEX_KEY = 'devsurvey-preview-index'

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
	saveIndex(0)
}

export function setAnswer(id: string, value: Answer): void {
	if (value === undefined) {
		delete answers[id]
	} else {
		answers[id] = value
	}

	save()
}

export function loadIndex(): number {
	if (typeof sessionStorage === 'undefined') return 0

	const raw = sessionStorage.getItem(INDEX_KEY)
	const n = raw ? Number(raw) : 0

	return Number.isFinite(n) && n >= 0 ? n : 0
}

export function saveIndex(i: number): void {
	if (typeof sessionStorage === 'undefined') return

	sessionStorage.setItem(INDEX_KEY, String(i))
}
