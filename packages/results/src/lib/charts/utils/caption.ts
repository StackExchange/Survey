// The facts under every chart: sr-only caption, `<desc>` and ../svg/Stats.svelte.
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

// The same facts on one line. Only the `<desc>` carries `reading`.
export function captionText(figure: any, reading?: string) {
	const { demographic, n, share, subtext } = captionOf(figure)

	return [reading, demographic, n && `n = ${n}`, share && `${share} of respondents`, subtext].filter(Boolean).join(' · ')
}
