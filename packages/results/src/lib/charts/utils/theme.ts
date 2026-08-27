// Presentation attributes, not CSS classes: a chart also renders as a standalone
// .svg and into a canvas. The literal is what a file opened on its own resolves
// to. routes/layout.css defines the variables; keep the two in step.
const token = (name: string, fallback: string) => `var(--chart-${name}, ${fallback})`

export const theme = {
	background: token('bg', '#F0EFEE'),
	ink: token('ink', '#201c1d'),
	muted: token('muted', '#636261'),
	rule: token('rule', '#c6d1e1'),
	grid: token('grid', '#bcb9b3'),
	tint: token('tint', '#f9f8f8'),
	accent: token('accent', '#ff5e00'),
	onAccent: token('on-accent', '#201c1d'),

	focus: token('focus', '#5074ef'),
	onFocus: token('on-focus', '#ffffff'),
	rest: token('rest', '#998b7a'),
	dim: token('dim', '#bcb9b3'),
	onRest: token('on-rest', '#201c1d'),

	from: token('from', '#5074ef'),
	to: token('to', '#ff5e00'),

	faceTop: token('face-top', '#ff5e00'),
	faceSide: token('face-side', '#998b7a'),

	// The unfilled cells of a waffle. Heavier than `tint`, which disappears
	// against the page at this size.
	ghost: token('ghost', '#e5e4e3'),

	// An 'off' cube's three faces, from the base artwork. Its own greys rather than
	// faded versions of the live ones: washing the live faces back loses the
	// shading direction, and a cube you can't read the top of stops being a cube.
	offTop: token('off-top', '#b6b6b6'),
	offLeft: token('off-left', '#423d3d'),
	offRight: token('off-right', '#ffffff'),

	// Index with `series(i)` — a sankey carries more nodes than there are colours.
	series: [
		token('series-1', '#5074ef'),
		token('series-2', '#9e9cff'),
		token('series-3', '#f39fff'),
		token('series-4', '#ffcc01'),
		token('series-5', '#85af24'),
		token('series-6', '#ff5e00'),
		token('series-7', '#998b7a'),
		token('series-8', '#00165e'),
	],

	// The readable ink for each swatch above.
	onSeries: [
		token('on-series-1', '#ffffff'),
		token('on-series-2', '#201c1d'),
		token('on-series-3', '#201c1d'),
		token('on-series-4', '#201c1d'),
		token('on-series-5', '#201c1d'),
		token('on-series-6', '#ffffff'),
		token('on-series-7', '#201c1d'),
		token('on-series-8', '#ffffff'),
	],


	font: 'Stack Sans Text, system-ui, sans-serif',
	fontHeadline: 'Stack Sans Headline, system-ui, sans-serif',
}

export const series = (i: number) => theme.series[i % theme.series.length]

export const onSeries = (i: number) => theme.onSeries[i % theme.onSeries.length]

// The space between one mark and the next — waffle cells, bars, rank rows, treemap
// cells. One value, so the forms read as a set rather than seven near-misses.
export const GAP = 8

export const PAD = 15

// The wash laid over the row under the pointer, and the opacity of the hero marks
// that aren't. Both were repeated as bare literals across the charts.
export const HOVER_WASH = 0.05
export const DIM = 0.75

// An 'off' cube's own opacity, off the base artwork. A group opacity rather than
// three faded fills: one number to change, and the faces don't composite against
// each other where they meet.
export const OFF = 0.26

// `places` is for the few values that aren't lengths: a scale factor multiplies
// up, so it needs more of them.
export function px(n: number, places = 2) {
	const factor = 10 ** places
	return Math.round(n * factor) / factor
}

export const pxPath = (d: string) => d.replace(/\d+\.\d+/g, (n) => String(px(Number(n))))

// No text measurement where these charts render. Stack Sans advances 0.534 em
// per glyph, measured in a browser at 11, 12, 13 and 18px.
const GLYPH = 0.534
const GLYPH_DIGITS = 0.66

export const textWidth = (text: string, fontSize: number) => px(text.length * fontSize * GLYPH)

// An `<svg>` clips at its viewBox, so a height measured to the baseline cuts off
// every descender.
export const descent = (fontSize: number) => px(fontSize * 0.34)

// `dominant-baseline` baked into `y`: Figma and most SVG converters ignore the
// attribute and read `y` as the alphabetic baseline.
export const middle = (y: number, fontSize: number) => px(y + fontSize * 0.35)

export const hanging = (y: number, fontSize: number) => px(y + fontSize * 0.7)

export const chars = (px: number, fontSize: number) => Math.max(1, Math.floor(px / (fontSize * GLYPH)))

export const digitsWidth = (text: string, fontSize: number) => px(text.length * fontSize * GLYPH_DIGITS)

export const labelGutter = (width: number) => Math.round(width * 0.2)

const MIN_GUTTER_CHARS = 18

// Whether a row chart draws its label above the bar rather than beside it,
// because the gutter is too narrow to hold a useful number of characters.
export const labelsAbove = (width: number, fontSize: number) => chars(labelGutter(width), fontSize) < MIN_GUTTER_CHARS

export const SWATCH = 9
const LEGEND_ROW = 22

// Returns its own height so a chart reserves the space from the same layout
// ./Legend.svelte draws from.
export function legend(labels: any[], width: number) {
	const items: { label: string; i: number; x: number; row: number }[] = []
	let x = 0
	let row = 0

	for (const [i, label] of labels.entries()) {
		const text = String(label)
		const w = textWidth(text, 12) + SWATCH + 22
		if (x && x + w > width) {
			row++
			x = 0
		}
		items.push({ label: text, i, x: px(x), row })
		x += w
	}

	return { items, rowHeight: LEGEND_ROW, height: (row + 1) * LEGEND_ROW + 10 }
}

export function wrapText(text: string, width: number, fontSize: number, max = 2) {
	const room = chars(width, fontSize)
	const lines: string[] = []

	for (const word of String(text ?? '')
		.split(/\s+/)
		.filter(Boolean)) {
		const at = lines.length - 1

		if (!lines.length) lines.push(word)
		else if (lines[at].length + 1 + word.length <= room) lines[at] += ` ${word}`
		else if (lines.length < max) lines.push(word)
		else {
			lines[at] = clip(`${lines[at]} ${word}`, room)
			break
		}
	}

	return lines
}

export const figureTitle = (figure: any) => figure.headline || figure.name || figure.question || figure.chart

export const clip = (text: string, chars: number) => (text.length > chars ? `${text.slice(0, chars - 1).trimEnd()}…` : text)

// The figure's short form of a response where it has one, resolved in
// $lib/server/content.
export const shorten = (figure: any) => (value: unknown) => {
	const text = String(value ?? '')
	return figure?.shorts?.[text] ?? text
}

export function percent(share?: number) {
	const value = (share ?? 0) * 100
	// Rounding a real-but-tiny share to "0%" reads as none at all.
	if (value > 0 && value < 1) return '<1%'
	return `${Math.round(value)}%`
}

export const count = (value?: number) => (value ?? 0).toLocaleString('en-US')
