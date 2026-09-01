// Presentation attributes, not CSS classes: a chart also renders standalone and
// into a canvas. routes/layout.css defines the variables; keep the two in step.
const token = (name: string, fallback: string) => `var(--chart-${name}, ${fallback})`

export const theme = {
	background: token('bg', '#F0EFEE'),
	ink: token('ink', '#201c1d'),
	muted: token('muted', '#636261'),
	rule: token('rule', '#c6d1e1'),
	grid: token('grid', '#bcb9b3'),
	tint: token('tint', '#f9f8f8'),
	accent: token('accent', '#ff5e00'),

	focus: token('focus', '#5074ef'),
	onFocus: token('on-focus', '#ffffff'),
	rest: token('rest', '#998b7a'),
	dim: token('dim', '#bcb9b3'),
	onRest: token('on-rest', '#201c1d'),

	from: token('from', '#5074ef'),
	to: token('to', '#ff5e00'),

	// A rank row's track. Heavier than `tint`, which disappears at this size.
	ghost: token('ghost', '#e5e4e3'),

	// An 'off' cube's three faces. Its own greys, not faded live ones: washing
	// the live faces back loses the shading direction.
	offTop: token('off-top', '#424242'),
	offLeft: token('off-left', '#a09e9b'),
	offRight: token('off-right', '#ccc8c2'),

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

export const FINE = 12 // axis ticks, point names, legend
export const SMALL = 14 // standard data charts, and the chrome band
export const LABEL = 15 // editorial 2d/3d row labels
export const VALUE = 25 // the display number

// Between a value's baseline and the name under it.
export const LABEL_DY = 22

export const CAPTION_SHARE = 0.4

export const GAP = 8

export const PAD = 15

// What a chart hands its host on hover. A prop, not a context: ./export.ts mounts
// a chart with no host to report to.
interface TooltipRow {
	value: string
	label?: string
	color?: string
}

export interface TooltipData {
	// The full, unclipped category, often longer than the chart could draw.
	title: string
	rows: TooltipRow[]
}

export type OnHover = (data: TooltipData | null, event?: PointerEvent) => void

// Hit areas are at least this tall, so a thin mark stays catchable.
export const HIT = 24

export const HOVER_WASH = 0.05
export const DIM = 0.75

// An 'off' cube's opacity. A group opacity rather than three faded fills, so the
// faces don't composite against each other where they meet.
export const OFF = 0.5

// `places` is for the few values that aren't lengths — a scale factor needs more.
export function px(n: number, places = 2) {
	const factor = 10 ** places
	return Math.round(n * factor) / factor
}

// No text measurement where these charts render. Stack Sans advances 0.534 em
// per glyph, measured in a browser at 11, 12, 13 and 18px.
const GLYPH = 0.534
const GLYPH_DIGITS = 0.66

export const textWidth = (text: string, fontSize: number) => px(text.length * fontSize * GLYPH)

// An `<svg>` clips at its viewBox, so a height to the baseline cuts descenders.
export const descent = (fontSize: number) => px(fontSize * 0.34)

// `dominant-baseline` baked into `y`: Figma and most converters ignore it.
export const middle = (y: number, fontSize: number) => px(y + fontSize * 0.35)

export const hanging = (y: number, fontSize: number) => px(y + fontSize * 0.7)

export const chars = (room: number, fontSize: number) => Math.max(1, Math.floor(room / (fontSize * GLYPH)))

export const digitsWidth = (text: string, fontSize: number) => px(text.length * fontSize * GLYPH_DIGITS)

export const labelGutter = (width: number) => Math.round(width * 0.25)

const MIN_GUTTER_CHARS = 18

export const labelsAbove = (width: number, fontSize: number) => chars(labelGutter(width), fontSize) < MIN_GUTTER_CHARS

export const SWATCH = 9
const LEGEND_ROW = 22
const LEGEND_SPACE = 22
export const LEGEND_GAP = 6

// Returns its own height so a chart reserves the space from the same layout
// ../svg/Legend.svelte draws from.
export function legend(labels: any[], width: number) {
	const items: { label: string; i: number; x: number; row: number }[] = []
	let x = 0
	let row = 0

	for (const [i, label] of labels.entries()) {
		const text = String(label)
		const w = textWidth(text, FINE) + SWATCH + LEGEND_SPACE
		if (x && x + w > width) {
			row++
			x = 0
		}
		items.push({ label: text, i, x: px(x), row })
		x += w
	}

	return { items, rowHeight: LEGEND_ROW, height: (row + 1) * LEGEND_ROW + 10 }
}

export const figureTitle = (figure: any) => figure.headline || figure.name || figure.question || figure.chart

export const clip = (text: string, chars: number) => (text.length > chars ? `${text.slice(0, chars - 1).trimEnd()}…` : text)

// The figure's short form of a response, resolved in $lib/server/content.
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
