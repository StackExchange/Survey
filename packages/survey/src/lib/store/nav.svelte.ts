// Navigation state for the long-scroll preview.
//
// The whole survey renders as one scrollable column — each page is a
// `<section>` with a stable `id` derived from its first question. URL state
// is just the hash (`#q-<question-id>`), which the browser handles natively
// for back/forward + initial load.
//
// `nav.index` is set by the Pager's IntersectionObserver as the user scrolls
// (it's whichever page section is currently in view). The MiniMap reads
// `nav.index` to highlight the current page, and calls `navigate()` /
// `jumpToQuestion()` to smooth-scroll the viewport to a section.

import { flatten } from '$lib/data/flow'
import { questions, survey } from '$lib/data/load'
import type { Page } from '$lib/types'

export const pages: Page[] = flatten(survey.flow, questions, { respectRandomizerSubset: false })

// Stable DOM id for a page's section. Used as both the scroll target and
// the URL hash. Prefixed so it can never collide with a question id used
// as an `aria-labelledby` or similar elsewhere on the page.
export function pageAnchorId(page: Page): string {
	return `q-${page.questions[0]}`
}

export const nav = $state({ index: 0 })

export function setCurrentIndex(i: number): void {
	if (i !== nav.index && i >= 0 && i < pages.length) {
		nav.index = i
		// Mirror the current section into the URL hash so HMR / refresh /
		// shared links land back on the same page. `replaceState` so the
		// scroll stream doesn't bloat browser history.
		if (typeof history !== 'undefined') {
			history.replaceState(null, '', `#${pageAnchorId(pages[i])}`)
		}
	}
}

function scrollToPage(i: number): void {
	if (typeof document === 'undefined' || i < 0 || i >= pages.length) return
	const id = pageAnchorId(pages[i])
	const el = document.getElementById(id)
	if (!el) return
	el.scrollIntoView({ behavior: 'smooth', block: 'start' })
	// Update the URL hash without retriggering the browser's own jump-scroll.
	history.replaceState(null, '', `#${id}`)
}

export function navigate(i: number): void {
	scrollToPage(i)
}

export function jumpToQuestion(qid: string): void {
	const i = pages.findIndex((p) => p.questions.includes(qid))
	if (i >= 0) scrollToPage(i)
}
