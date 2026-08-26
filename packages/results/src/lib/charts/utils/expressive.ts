// What the 3D and 2D charts share. A feature arrives already
// narrowed by $lib/server/content.ts, so a component never filters again.
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'

import { count, GAP, percent, px, shorten } from '$charts/utils/theme'

export const rowsOf = (figure: any) => (figure.data ?? []).filter(Boolean)

// The one response a figure was told to accent, named in full by the `focus`
// column on the sheet's Features tab. scripts/data.js checks it against the rows
// it emitted, so what arrives here either matches a row or is null.
//
// The row itself, not the string: charts slice, sort and re-rank their rows, and
// an identity check against the row survives all three. Nothing dims — a focus
// recolours the mark it names and leaves hover the only thing changing opacity.
export const focusedOf = (figure: any) =>
	figure?.focus ? (rowsOf(figure).find((row: any) => row.response === figure.focus) ?? null) : null

// The salary questions carry a named measure instead of a share, resolved by the
// loader into `{key, label, unit}`. Everything else is `pct`.
export const valueOf = (figure: any) => figure.value ?? null

// `pick` is for the charts whose row holds several measurements — a clustered
// bar reads `row.cells[i]`, so it passes the cell in rather than the row.
type Pick = (...args: any[]) => any
const self: Pick = (row: any) => row

// A share as its label shows it. Two marks that both read 69% are drawn the same
// size, rather than 0.6945 and 0.6863 apart by a pixel or two — and a real-but-tiny
// share stays off zero, as `percent` keeps it off "0%".
const shown = (share: number) => {
	const rounded = Math.round(share * 100) / 100

	return rounded === 0 && share > 0 ? share : rounded
}

export const amountOf = (figure: any, pick: Pick = self) => {
	const value = valueOf(figure)
	return (...args: any[]) => {
		const cell = pick(...args)
		// A named measure is a count, not a share, so it is drawn as it comes.
		return value ? (cell?.[value.key] ?? 0) : shown(cell?.pct ?? 0)
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

export function treemapCells(rows: any[], values: number[], width: number, height: number, padding = GAP) {
	const root = hierarchy({ children: rows.map((row, i) => ({ row, i, value: Math.max(values[i], 0) })) } as any)
		.sum((d: any) => d.value ?? 0)
		.sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))

	// `ratio(1)` rather than d3's default golden ratio: these cells carry two lines of
	// type each, and a square holds a label where a 1.6-wide cell drops it.
	treemap().tile(treemapSquarify.ratio(1)).size([width, height]).paddingInner(padding).round(true)(root)

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

// The isometric cube these forms are built from, at the base artwork's own 160-wide
// scale so the numbers here are the ones in the .svg. Replacing the artwork is
// replacing these three paths and the two measurements under them.
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
