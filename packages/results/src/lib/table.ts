// A figure's rows as a table, for the markdown twins and the screen-reader table
// beside each chart. Shared so the two cannot disagree.
import { columnLabel } from '$lib/measures'

// Key-union rather than a switch on chart type: a question can carry any of the
// named measures beside `count` and `pct`, so a new one renders without a branch.
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

// Quoted per RFC 4180.
export function toCsv(rows: any[]) {
	const clean = toRows(rows)
	if (!clean.length) return ''

	const keys = Object.keys(clean[0])
	const quote = (v: any) => {
		const text = String(v ?? '')
		return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
	}

	return [keys.join(','), ...clean.map((row) => keys.map((key) => quote(row[key])).join(','))].join('\r\n')
}
