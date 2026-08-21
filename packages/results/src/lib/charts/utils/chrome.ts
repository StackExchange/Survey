// What an export adds around a chart. By context, not by prop: nothing on the
// page sets it, so `read()` is undefined there and every chart draws unchanged.
import { IconAnswer, IconInfo, IconLogo, IconUserStack } from '@stackoverflow/stacks-icons/icons'
import { getContext, setContext } from 'svelte'

import { PAD, textWidth, wrapText } from './theme'

export interface Chrome {
	brand?: boolean
	/** The masthead band. Only the downloaded file carries it; the preview does not. */
	footer?: boolean
	year?: string
	/** Responses to bring forward. Everything else dims. */
	focus?: string[]
	/** Scale a share chart to its own largest value rather than to a full 100%. */
	normalise?: boolean
	headline?: string
	/** The question's canonical URL, drawn in the masthead. */
	url?: string
	/** The cut the figure is of — "All Respondents", "United Kingdom". */
	demographic?: string
}

// Fixed, not measured: a chart that followed its container would put a different
// drawing in the file than the one on screen. Below this the drawing scrolls.
export const CHART_WIDTH = 950

// The band across the bottom: the survey and its URL on the left, the logo in an
// orange block at the right.
export const MASTHEAD = 48
export const LOGO = 20
// Around the logo, and so what sets the orange block's width.
export const LOGO_PAD = 20

export const TITLE_SIZE = 26
export const ASIDE = 14
export const STATS = 26

// Asked before the chart is drawn: everything below shifts down by `height`.
export function headerLayout(chrome: Chrome, width: number, margin = PAD) {
	const top = margin
	const lines = chrome.headline ? wrapText(chrome.headline, width - margin * 2, TITLE_SIZE, 2) : []

	return { top, lines, height: lines.length ? top + lines.length * (TITLE_SIZE * 1.2) + 10 : top }
}

const KEY = Symbol('chart-chrome')

// A getter, not a value: the preview re-renders as options change.
export const setChrome = (read: () => Chrome) => setContext(KEY, read)

export const chromeReader = () => getContext<(() => Chrome) | undefined>(KEY)

// `undefined` until something is focused, so an unhighlighted chart serialises
// byte for byte as it did before. Call at init; the return reads on each call.
export function useFocus() {
	const read = chromeReader()

	return (response: unknown) => {
		const focus = read?.().focus
		if (!focus?.length) return undefined
		return typeof response === 'string' && focus.includes(response) ? 1 : 0.22
	}
}

// The top of a share chart's scale. Call at init; the return reads on each call.
export function useDomain() {
	const read = chromeReader()

	// Never zero: an empty or all-zero set would divide the scale by nothing.
	return (values: number[]) => (read?.().normalise ? Math.max(0.01, ...values) : 1)
}

export interface Glyph {
	width: number
	height: number
	markup: string
}

// The root's size and `.svg-icon` class rely on CSS a downloaded file never
// sees, so both go and Glyph.svelte's fill is the only one that applies.
function flatten(src: string): Glyph {
	const [, width, height] = src.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!

	const markup = src
		.replace(/^[\s\S]*?<svg[^>]*>/, '')
		.replace(/<\/svg>\s*$/, '')
		// `fill="none"` is a hollow shape, not a colour, so it stays.
		.replace(/\sfill="(?!none)[^"]*"/g, '')

	return { width: Number(width), height: Number(height), markup }
}

export const logo = flatten(IconLogo)

export const icons = {
	respondents: flatten(IconUserStack),
	share: flatten(IconAnswer),
	note: flatten(IconInfo),
}
