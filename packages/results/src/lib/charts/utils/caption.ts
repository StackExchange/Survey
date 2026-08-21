// The facts that sit under every chart. Three places render them — the page's
// sr-only caption, the SVG `<desc>` and the drawn band in ../svg/Stats.svelte —
// and they were assembled independently in all three, so this is the one read of
// `figure.demographic`.
import { count } from '$charts/utils/theme'
import { ofSurvey } from '$lib/table'

export interface Caption {
	demographic: string
	/** Already formatted, or empty where the cut carries no count. */
	n: string
	share: string
	subtext: string
}

export function captionOf(figure: any): Caption {
	const n = figure?.demographic?.n

	return {
		demographic: figure?.demographic?.name ?? '',
		// Absent rather than zero: a cut with no count should say nothing at all.
		n: n == null ? '' : count(n),
		share: ofSurvey(figure?.demographic?.share) ?? '',
		subtext: figure?.subtext ? String(figure.subtext) : '',
	}
}

// The same facts on one line. `reading` is the chart-in-a-sentence from
// ./expressive.ts, which only the `<desc>` carries.
export function captionText(figure: any, reading?: string) {
	const { demographic, n, share, subtext } = captionOf(figure)

	return [reading, demographic, n && `n = ${n}`, share && `${share} of respondents`, subtext].filter(Boolean).join(' · ')
}
