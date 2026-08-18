// What to call a column.
//
// The export ships raw column names and no presentation — deliberately, so the
// same column can't word itself differently across 283 datasets. One registry,
// read by the generator (which decides which column a figure plots) and by
// `$lib/table` for column headings.
//
// Eventually this arrives as a `measures` block in the export's index.json and
// the file becomes a reader. Until then it is the one place the wording lives.
//
// `label` is the axis title or tooltip line, where there is room to be exact.
// `short` is the table heading, where there isn't — a header clipped to
// "Percent of re…" says less than "Percent".

export type Label = { key: string; label: string; unit: string }

const REGISTRY: Record<string, { label: string; unit?: string; short?: string }> = {
	count: { label: 'Respondents' },
	pct: { label: 'Percent of respondents', unit: '%', short: 'Percent' },
	median_yearly_salary_usd: { label: 'Median yearly salary (USD)', unit: '$', short: 'Median salary' },
	mean_yearly_salary_usd: { label: 'Mean yearly salary (USD)', unit: '$', short: 'Mean salary' },
	mean_prof_years: { label: 'Average years of professional experience', short: 'Years of experience' },
	rank: { label: 'Overall rank' },
	median_rank: { label: 'Median rank' },
	mode_rank: { label: 'Modal rank', short: 'Mode rank' },
	series: { label: 'Segment' },
}

const humanise = (key: string) => key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

export const labelFor = (key: string): Label => ({
	key,
	label: REGISTRY[key]?.label ?? humanise(key),
	unit: REGISTRY[key]?.unit ?? '',
})

export const columnLabel = (key: string) => REGISTRY[key]?.short ?? REGISTRY[key]?.label ?? humanise(key)

// The shape every row has. Anything else a row carries is a value worth labelling.
export const STRUCTURAL = new Set(['slice', 'series', 'response', 'count', 'pct'])
