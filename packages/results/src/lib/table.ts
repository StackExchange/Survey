// A figure's rows as a table, for the markdown twins and the screen-reader table
// beside each chart. Shared so the two cannot disagree.
import { csvFormat } from 'd3-dsv'

import { columnLabel } from '$lib/labels'

// Key-union rather than a switch on chart type: a question can carry any of the
// named columns beside `count` and `pct`, so a new one renders without a branch.
export const columns = (rows: any[]) => [...new Set(rows.filter(Boolean).flatMap((row) => Object.keys(row)))]

// Whole numbers: the smallest cut in the export is 1.6%, so nothing rounds to 0%.
export const ofSurvey = (share: number | null | undefined) => (typeof share === 'number' ? `${Math.round(share * 100)}%` : null)

// `pct` is the only 0–1 fraction in the export; everything else is a count, a
// currency amount or a rank, and reads as itself.
export function cell(value: any, key: string): string {
	if (typeof value !== 'number') return String(value ?? '')
	return key === 'pct' ? `${(value * 100).toFixed(1)}%` : value.toLocaleString('en-US')
}

// The heading a column gets. `response` is whatever the question is about, so it
// borrows the question's own name rather than saying "Response".
export const headerFor = (key: string, questionName?: string | null) => (key === 'response' ? questionName || 'Response' : columnLabel(key))

const rowsOf = (rows: any[]) => (rows ?? []).filter(Boolean)

/**
 * Flat `(response, series)` rows regrouped into one entry per response, with a
 * slot per series in `series` order — `null` where the export has no row for
 * that combination.
 *
 * The four multi-series charts all need exactly this, and the export writes rows
 * response-major, so first appearance is the display order.
 */
export function bySeries(rows: any[], series: string[]) {
	const order: string[] = []
	const index: Record<string, Record<string, any>> = {}

	for (const row of rowsOf(rows)) {
		const response = String(row.response ?? '')
		if (!index[response]) {
			index[response] = {}
			order.push(response)
		}
		index[response][String(row.series ?? '')] = row
	}

	return order.map((response) => ({ response, cells: series.map((name) => index[response][name] ?? null) }))
}

export function toMarkdown(rows: any[]) {
	const clean = rowsOf(rows)
	if (!clean.length) return ''

	const keys = columns(clean)
	const escape = (value: string) => value.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')

	return [
		`| ${keys.join(' | ')} |`,
		`| ${keys.map(() => '---').join(' | ')} |`,
		...clean.map((row) => `| ${keys.map((key) => escape(cell(row[key], key))).join(' | ')} |`),
	].join('\n')
}

// Squared off to one key set, with the raw values rather than `cell`'s display
// strings: "1,234" and "12.3%" arrive in a spreadsheet as text.
export function toRows(rows: any[]) {
	const clean = rowsOf(rows)
	const keys = columns(clean)

	return clean.map((row) => Object.fromEntries(keys.map((key) => [key, (row[key] ?? null) as any])))
}

// d3-dsv rather than a hand-rolled quoter: same field escaping, already in the
// project, and small enough to ship — this runs in the browser on download.
export function toCsv(rows: any[]) {
	const clean = rowsOf(rows)
	return clean.length ? csvFormat(toRows(rows), columns(clean)) : ''
}
