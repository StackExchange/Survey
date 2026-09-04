import { count, percent, px, shorten } from '$charts/utils/theme'
import { bySeries, ofSurvey } from '$lib/table'

export const rowsOf = (figure: any) => (figure.data ?? []).filter(Boolean)

// A line chart's default line count: past this, colors start repeating —
// the palette (`theme.series`) only has this many.
export const LINE_SERIES_DEFAULT = 8

// A line chart's series, ranked by their most recent value — the customize
// panel's row order, and a line chart's own default (its first `n`).
export function rankedSeriesOf(figure: any): string[] {
	const all: string[] = figure?.series ?? []
	if (!all.length) return all

	const grouped = bySeries(figure?.data ?? [], all)
	const numeric = grouped.length > 1 && grouped.every((row: any) => Number.isFinite(Number(row.response)))
	const chronological = numeric ? [...grouped].sort((a: any, b: any) => Number(a.response) - Number(b.response)) : grouped
	const latest = chronological.at(-1)

	return all
		.map((name: string, i: number) => ({ name, value: latest?.cells[i]?.pct ?? 0 }))
		.sort((a: any, b: any) => b.value - a.value)
		.map((entry: any) => entry.name)
}

// The one response the sheet's `focus` column named, as the row not the string:
// charts slice, sort and re-rank, and an identity check survives all three.
export const focusedOf = (figure: any) =>
	figure?.focus ? (rowsOf(figure).find((row: any) => row.response === figure.focus) ?? null) : null

// A named measure `{key, label, unit}` — the salary questions. Else `pct`.
export const valueOf = (figure: any) => figure.value ?? null

// `pick` is for rows holding several measurements: a clustered bar passes the cell.
type Pick = (...args: any[]) => any
const self: Pick = (row: any) => row

// A share as its label shows it, so two marks both reading 69% are drawn alike.
const shown = (share: number) => {
	const rounded = Math.round(share * 100) / 100

	return rounded === 0 && share > 0 ? share : rounded
}

export const amountOf = (figure: any, pick: Pick = self) => {
	const value = valueOf(figure)
	return (...args: any[]) => {
		const cell = pick(...args)
		return value ? (cell?.[value.key] ?? 0) : shown(cell?.pct ?? 0)
	}
}

export const formatOf = (figure: any, pick: Pick = self) => {
	const value = valueOf(figure)
	const amount = amountOf(figure, pick)
	return (...args: any[]) => (value ? `${value.unit ?? ''}${count(amount(...args))}` : percent(amount(...args)))
}

// Never zero: an all-zero set would divide a scale by nothing.
export const largestOf = (values: number[]) => Math.max(0.0001, ...values)

// The facts under every chart: sr-only caption, `<desc>` and ../svg/Stats.svelte.
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

// The chart in a sentence, for the `<desc>`.
export function readingOf(figure: any, limit = 6) {
	const rows = rowsOf(figure)
	const short = shorten(figure)
	const format = formatOf(figure)

	const said = rows.slice(0, limit).map((row: any) => `${short(row.response)} ${format(row)}`)
	if (rows.length > limit) said.push(`and ${rows.length - limit} more`)

	return said.join(', ')
}

// The one number a waffle draws. `values` means the sheet picked a set to add up.
export function shareOf(figure: any) {
	const rows = rowsOf(figure)
	const amount = amountOf(figure)

	return figure.values
		? Math.min(
				rows.reduce((total: number, row: any) => total + amount(row), 0),
				1
			)
		: amount(rows[0])
}

// "1 in 5" — how many respondents one filled cell stands for.
export const oneIn = (share: number) => Math.max(2, Math.round(1 / Math.max(share, 0.0001)))

export function grid(n: number, width: number, gap: number) {
	const columns = Math.min(n, Math.max(1, Math.round(Math.sqrt(n * 1.6))))
	const rows = Math.ceil(n / columns)
	const size = px((width - gap * (columns - 1)) / columns)

	return { columns, rows, size, height: px(rows * size + gap * (rows - 1)) }
}

// The isometric cube, at the base artwork's own 160-wide scale.
const UNIT = 160

export const CUBE = {
	top: 'M0 46.188L80 0L160 46.188L80 92.376Z',
	left: 'M0 46.188L80 92.376L80 184.752L0 138.564Z',
	right: 'M80 92.376L160 46.188L160 138.564L80 184.752Z',
}

const CUBE_HEIGHT = 184.752 / UNIT

// Uniform scale, so the 30° edges stay 30°.
export const cube = (x: number, y: number, size: number) => `translate(${px(x)} ${px(y)}) scale(${px(size / UNIT, 4)})`

export const cubeHeight = (size: number) => size * CUBE_HEIGHT

// The 3D bar's nose, as a share of the bar's thickness — the flatter cousin of
// the cube's projection, at the base artwork's own 160-wide scale.
export const NOSE_RISE = 30 / 160
