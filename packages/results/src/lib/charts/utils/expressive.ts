import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'

import { count, GAP, percent, px, shorten } from '$charts/utils/theme'

export const rowsOf = (figure: any) => (figure.data ?? []).filter(Boolean)

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

// A trailing "%" is drawn smaller than its number, so it is split off.
export function splitUnit(text: string) {
	const figures = String(text ?? '')
	return figures.endsWith('%') ? { figures: figures.slice(0, -1), unit: '%' } : { figures, unit: '' }
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

export function treemapCells(rows: any[], values: number[], width: number, height: number, padding = GAP) {
	const root = hierarchy({ children: rows.map((row, i) => ({ row, i, value: Math.max(values[i], 0) })) } as any)
		.sum((d: any) => d.value ?? 0)
		.sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))

	// `ratio(1)` not d3's golden default: a square holds two lines of type.
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

const PLATE_RISE = 46.188 / UNIT

export const plateRise = (w: number) => w * PLATE_RISE

// The stepped stack's plate: the cube's top face over a shallower extrusion.
// `w` is the rhombus at its widest; `cy` is the centre of the top face.
export const plate = (cx: number, cy: number, w: number, depth: number) => {
	const hw = w / 2
	const hh = plateRise(w)
	const point = (x: number, y: number) => `${px(x)} ${px(y)}`

	return {
		top: `M${point(cx, cy - hh)}L${point(cx + hw, cy)}L${point(cx, cy + hh)}L${point(cx - hw, cy)}Z`,
		left: `M${point(cx - hw, cy)}L${point(cx, cy + hh)}L${point(cx, cy + hh + depth)}L${point(cx - hw, cy + depth)}Z`,
		right: `M${point(cx + hw, cy)}L${point(cx, cy + hh)}L${point(cx, cy + hh + depth)}L${point(cx + hw, cy + depth)}Z`,
	}
}
