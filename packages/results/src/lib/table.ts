// A figure's rows as a table: the markdown twins, the screen-reader table beside
// each chart, and the "Use this data" exports are all renderings of `tableOf`.
//
// Columns arrive resolved on the figure — `{ key, header, unit, numeric }`, from
// scripts/data.js. Nothing here re-derives them; it only formats and arranges.
import { csvFormat } from 'd3-dsv'

import { licence, siteName } from '$config'

// Whole numbers: the smallest cut in the export is 1.6%, so nothing rounds to 0%.
export const ofSurvey = (share: number | null | undefined) => (typeof share === 'number' ? `${Math.round(share * 100)}%` : null)

// The `n =` beside a cut, wherever it is written — the figcaption, the table
// caption, the markdown twin. An em-dash where the export has no count, so a
// missing `n` reads as missing rather than as zero.
export const respondents = (n: number | null | undefined) => n?.toLocaleString('en-US') ?? '—'

// `%` is a 0–1 fraction, `$` an amount; anything else reads as itself.
function cell(value: any, unit: string): string {
	if (typeof value !== 'number') return String(value ?? '')
	if (unit === '%') return `${(value * 100).toFixed(1)}%`

	const text = value.toLocaleString('en-US')
	return unit === '$' ? `$${text}` : text
}

const rowsOf = (figure: any) => (figure?.data ?? []).filter(Boolean)

const titleOf = (figure: any) => figure?.name ?? figure?.headline ?? figure?.dataId ?? null

// Flat `(response, series)` rows regrouped one entry per response, a slot per
// series, `null` where the export has no row for that pair. The export writes
// response-major, so first appearance is the display order.
export function bySeries(rows: any[], series: string[]) {
	const order: string[] = []
	const index: Record<string, Record<string, any>> = {}

	for (const row of (rows ?? []).filter(Boolean)) {
		const response = String(row.response ?? '')
		if (!index[response]) {
			index[response] = {}
			order.push(response)
		}
		index[response][String(row.series ?? '')] = row
	}

	return order.map((response) => ({ response, cells: series.map((name) => index[response][name] ?? null) }))
}

// The table a figure draws, from the cut it is already narrowed to. A
// multi-series question pivots: the long form repeats every response once per
// series and reads as three tables shuffled together. A pivoted cell holds the
// measure the chart plots, so the other numbers are a `toCsv`/`toRows` away.
//
// `response` rides beside the cells for the row controls to act on.
export function tableOf(figure: any) {
	const rows = rowsOf(figure)
	const columns = figure?.columns ?? []
	if (!rows.length || !columns.length) return null

	const series: string[] = figure?.series ?? []

	if (series.length) {
		const measure = columns.find((c: any) => c.key === (figure.value?.key ?? 'pct')) ?? columns.at(-1)
		const response = columns.find((c: any) => c.key === 'response')

		return {
			headers: [response?.header ?? 'Response', ...series],
			numeric: [false, ...series.map(() => true)],
			rows: bySeries(rows, series).map(({ response, cells }) => ({
				response,
				cells: [response, ...cells.map((row) => (row ? cell(row[measure.key], measure.unit) : ''))],
			})),
			measure: measure.key as string,
		}
	}

	return {
		headers: columns.map((c: any) => c.header as string),
		numeric: columns.map((c: any) => c.numeric as boolean),
		rows: rows.map((row: any) => ({
			response: typeof row.response === 'string' ? row.response : null,
			cells: columns.map((c: any) => cell(row[c.key], c.unit)),
		})),
		measure: null,
	}
}

const escape = (value: string) => value.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')

// Unpadded GFM: these files are read by models far more than by people, and
// padding every cell to its column width costs 60% more bytes.
export function toMarkdown(figure: any) {
	const table = tableOf(figure)
	if (!table) return ''

	return [
		`| ${table.headers.map(escape).join(' | ')} |`,
		`| ${table.numeric.map((right: boolean) => (right ? '---:' : '---')).join(' | ')} |`,
		...table.rows.map(({ cells }: any) => `| ${cells.map(escape).join(' | ')} |`),
	].join('\n')
}

// Raw values, not `cell`'s display strings: "1,234" arrives in a spreadsheet as
// text. Squared to the payload's keys, so a row missing one still lands under it.
export function toRows(figure: any) {
	const columns = figure?.columns ?? []
	return rowsOf(figure).map((row: any) => Object.fromEntries(columns.map((c: any) => [c.key, row[c.key] ?? null])))
}

// d3-dsv rather than a hand-rolled quoter: already here, and small enough to run
// in the browser on download.
export function toCsv(figure: any) {
	const rows = toRows(figure)
	return rows.length ? csvFormat(rows) : ''
}

// Enough envelope for the rows to stand on their own once the file has left the
// page — `columns` is what tells a reader that `pct` is a fraction.
export function toJson(figure: any, { year, url }: { year?: string | number; url?: string } = {}) {
	return {
		question: titleOf(figure),
		dataId: figure?.dataId ?? null,
		asked: figure?.definition?.title ?? null,
		year: year ?? null,
		url: url ?? null,
		demographic: figure?.demographic ?? null,
		series: figure?.series ?? null,
		columns: figure?.columns ?? [],
		licence: { name: licence.database.name, url: licence.database.url, holder: licence.holder },
		source: siteName,
		data: toRows(figure),
	}
}
