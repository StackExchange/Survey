// A figure's rows as a table, for the markdown twins and the screen-reader table
// beside each chart. Shared so the two cannot disagree.

// Key-union rather than a switch on plot_type: the export writes 20 row shapes
// across 7 plot types, so a new one renders without a new branch.
export const columns = (rows: any[]) => [...new Set(rows.filter(Boolean).flatMap((row) => Object.keys(row)))]

// Whole numbers: the smallest cut in the export is 1.6%, so nothing rounds to 0%.
export const ofSurvey = (share: number | null | undefined) => (typeof share === 'number' ? `${Math.round(share * 100)}%` : null)

// Every `percent*` value in the export is a 0–1 fraction, so all of them scale.
const share = (key: string) => key.startsWith('percent')

export function cell(value: any, key: string, labels?: string[] | null): string {
	if (Array.isArray(value)) return value.map((v) => cell(v, key, labels)).join(' / ')

	// A sankey row is {source, target, value} of indexes into the label array.
	if (labels && (key === 'source' || key === 'target')) return labels[value] ?? String(value)

	if (typeof value !== 'number') return String(value ?? '')
	return share(key) ? `${(value * 100).toFixed(1)}%` : value.toLocaleString('en-US')
}

const rowsOf = (rows: any[]) => (rows ?? []).filter(Boolean)

export function toMarkdown(rows: any[], labels?: string[] | null) {
	const clean = rowsOf(rows)
	if (!clean.length) return ''

	const keys = columns(clean)
	const escape = (value: string) => value.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ')

	return [
		`| ${keys.join(' | ')} |`,
		`| ${keys.map(() => '---').join(' | ')} |`,
		...clean.map((row) => `| ${keys.map((key) => escape(cell(row[key], key, labels))).join(' | ')} |`),
	].join('\n')
}

// The value behind a cell, not its display string: `cell`'s "1,234" and "12.3%"
// arrive in a spreadsheet as text.
function value(raw: any, key: string, labels?: string[] | null): any {
	if (Array.isArray(raw)) return raw.map((v) => value(v, key, labels))
	if (labels && (key === 'source' || key === 'target')) return labels[raw] ?? raw
	return raw ?? null
}

// Squared off to one key set. The CSV and the JSON are both this.
export function toRows(rows: any[], labels?: string[] | null) {
	const clean = rowsOf(rows)
	const keys = columns(clean)

	return clean.map((row) => Object.fromEntries(keys.map((key) => [key, value(row[key], key, labels)])))
}

// Quoted per RFC 4180.
export function toCsv(rows: any[], labels?: string[] | null) {
	const clean = toRows(rows, labels)
	if (!clean.length) return ''

	const keys = Object.keys(clean[0])
	// A stacked bar's frequency is one value per series. The CSV flattens it; the
	// JSON keeps the array.
	const flat = (v: any) => (Array.isArray(v) ? v.join(' / ') : String(v ?? ''))
	const quote = (v: any) => (/[",\r\n]/.test(flat(v)) ? `"${flat(v).replace(/"/g, '""')}"` : flat(v))

	return [keys.join(','), ...clean.map((row) => keys.map((key) => quote(row[key])).join(','))].join('\r\n')
}
