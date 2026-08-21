// What the Hero (3D) and Highlight (2D) charts share. A feature arrives already
// narrowed by $lib/server/content.ts, so a component never filters again.
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'

import { count, percent, px, shorten } from '$charts/utils/theme'

export const rowsOf = (figure: any) => (figure.data ?? []).filter(Boolean)

// The salary questions carry a named measure instead of a share, resolved by the
// loader into `{key, label, unit}`. Everything else is `pct`.
export const valueOf = (figure: any) => figure.value ?? null

// `pick` is for the charts whose row holds several measurements — a clustered
// bar reads `row.cells[i]`, so it passes the cell in rather than the row.
type Pick = (...args: any[]) => any
const self: Pick = (row: any) => row

export const amountOf = (figure: any, pick: Pick = self) => {
	const value = valueOf(figure)
	return (...args: any[]) => {
		const cell = pick(...args)
		return value ? (cell?.[value.key] ?? 0) : (cell?.pct ?? 0)
	}
}

export const formatOf = (figure: any, pick: Pick = self) => {
	const value = valueOf(figure)
	const amount = amountOf(figure, pick)
	return (...args: any[]) => (value ? `${value.unit ?? ''}${count(amount(...args))}` : percent(amount(...args)))
}

// Never zero: an empty or all-zero set would divide a scale by nothing. The
// epsilon is smaller than `useDomain`'s, which is scaling a drawn axis rather
// than guarding a division.
export const largestOf = (values: number[]) => Math.max(0.0001, ...values)

// The two extremes, for the forms that draw only the top and bottom response.
export function endsOf(rows: any[], amount: (row: any) => number) {
	const sorted = [...rows].sort((a, b) => amount(b) - amount(a))
	return sorted.length > 1 ? [sorted[0], sorted[sorted.length - 1]] : sorted
}

// A trailing "%" is drawn smaller than the number it follows, so it is split off
// rather than being part of the string.
export function splitUnit(text: string) {
	const figures = String(text ?? '')
	return figures.endsWith('%') ? { figures: figures.slice(0, -1), unit: '%' } : { figures, unit: '' }
}

// The chart in a sentence, for the `<desc>`. These forms draw few value labels —
// a waffle draws none — so without this the numbers exist only as geometry.
export function readingOf(figure: any, limit = 6) {
	const rows = rowsOf(figure)
	const short = shorten(figure)
	const format = formatOf(figure)

	const said = rows.slice(0, limit).map((row: any) => `${short(row.response)} ${format(row)}`)
	if (rows.length > limit) said.push(`and ${rows.length - limit} more`)

	return said.join(', ')
}

// "1 in 5" — how many respondents one filled cell of a waffle stands for.
export const oneIn = (share: number) => Math.max(2, Math.round(1 / Math.max(share, 0.0001)))

export function treemapCells(rows: any[], values: number[], width: number, height: number, padding = 4) {
	const root = hierarchy({ children: rows.map((row, i) => ({ row, i, value: Math.max(values[i], 0) })) } as any)
		.sum((d: any) => d.value ?? 0)
		.sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))

	treemap().tile(treemapSquarify).size([width, height]).paddingInner(padding).round(true)(root)

	return (root.leaves() as any[]).map((leaf) => ({
		row: leaf.data.row,
		i: leaf.data.i,
		x: leaf.x0,
		y: leaf.y0,
		width: Math.max(0, leaf.x1 - leaf.x0),
		height: Math.max(0, leaf.y1 - leaf.y0),
	}))
}

// A near-square grid for `n` cells — the waffle's shape.
export function grid(n: number, width: number, gap: number) {
	const columns = Math.min(n, Math.max(1, Math.round(Math.sqrt(n * 1.6))))
	const rows = Math.ceil(n / columns)
	const size = px((width - gap * (columns - 1)) / columns)

	return { columns, rows, size, height: px(rows * size + gap * (rows - 1)) }
}
