// Centralised navigation state for the preview.
//
// Owns the survey-wide page index (which page the respondent is currently
// looking at) and the helpers to mutate it — back/next, jump-to-index,
// jump-to-question-id. Both the Pager (Back/Next buttons, progress bar)
// and the MiniMap (sidebar) read from and write to this single store.
//
// Index source-of-truth precedence on initial load:
//   1. URL  `?q=<questionId>`         (so shared links work)
//   2. sessionStorage                 (so refresh + HMR don't lose position)
//   3. 0                              (fresh visit)
//
// On every navigate(), we push a new history entry with `?q=<first-question
// -id-on-the-new-page>` so browser back/forward retraces user jumps.

import { flatten } from '$lib/data/flow'
import { questions, survey } from '$lib/data/load'
import type { Page } from '$lib/types'

const INDEX_KEY = 'devsurvey-preview-index'

export const pages: Page[] = flatten(survey.flow, questions, { respectRandomizerSubset: false })

function indexFromUrl(): number {
	if (typeof location === 'undefined') return -1
	const qid = new URLSearchParams(location.search).get('q')
	if (!qid) return -1
	return pages.findIndex((p) => p.questions.includes(qid))
}

function indexFromStorage(): number {
	if (typeof sessionStorage === 'undefined') return 0
	const raw = sessionStorage.getItem(INDEX_KEY)
	const n = raw ? Number(raw) : 0
	if (!Number.isFinite(n) || n < 0 || n >= pages.length) return 0
	return n
}

function urlForIndex(i: number): string {
	const qid = pages[i]?.questions[0]
	const search = qid ? `?q=${encodeURIComponent(qid)}` : ''
	return `${location.pathname}${search}${location.hash}`
}

const initial = (() => {
	const fromUrl = indexFromUrl()
	if (fromUrl >= 0) return fromUrl
	return indexFromStorage()
})()

export const nav = $state({ index: initial })

function persistIndex(i: number): void {
	if (typeof sessionStorage !== 'undefined') {
		sessionStorage.setItem(INDEX_KEY, String(i))
	}
}

// Initial canonicalisation: replaceState so the URL reflects the resolved
// index without adding a history entry. Components call this once.
let canonicalised = false
export function canonicaliseUrl(): void {
	if (canonicalised || typeof history === 'undefined') return
	history.replaceState({ index: nav.index }, '', urlForIndex(nav.index))
	canonicalised = true
}

export function navigate(newIndex: number, push = true): void {
	if (newIndex < 0 || newIndex >= pages.length || newIndex === nav.index) return
	nav.index = newIndex
	persistIndex(newIndex)
	if (typeof history !== 'undefined') {
		const url = urlForIndex(newIndex)
		if (push) history.pushState({ index: newIndex }, '', url)
		else history.replaceState({ index: newIndex }, '', url)
	}
}

export function jumpToQuestion(qid: string): void {
	const i = pages.findIndex((p) => p.questions.includes(qid))
	if (i >= 0) navigate(i)
}

// Wire to browser back/forward. Returns an unsubscribe.
export function subscribePopState(): () => void {
	if (typeof window === 'undefined') return () => {}
	const onPop = () => {
		const i = indexFromUrl()
		if (i >= 0) nav.index = i
	}
	addEventListener('popstate', onPop)
	return () => removeEventListener('popstate', onPop)
}
