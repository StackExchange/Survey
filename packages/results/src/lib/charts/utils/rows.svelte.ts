import { LINE_SERIES_DEFAULT, rankedSeriesOf } from './expressive'

// Held by ChartDownload: ChartOptions sets it and the drawing reads it.

export function rowSelection(figure: () => any) {
	// Keyed by group: responses differ between cuts, so a row hidden in one
	// would silently apply to another.
	let dropped = $state<{ group: string; responses: string[] }>({ group: '', responses: [] })
	let lit = $state<{ group: string; responses: string[] }>({ group: '', responses: [] })

	// A line chart has no per-response row: its rows are its series (the
	// lines), ranked by their most recent value.
	const isLine = $derived(figure().chart === 'line')

	const rows = $derived(
		isLine ? rankedSeriesOf(figure()).map((response: string) => ({ response })) : (figure().data ?? []).filter(Boolean)
	)
	const responses = $derived(rows.map((row: any) => row.response))

	// Only where a response identifies one row: a sankey's are {source, target,
	// value}, and a write-ins table repeats them once per use_type.
	const listable = $derived(
		rows.length > 1 &&
			responses.every((response: unknown) => typeof response === 'string') &&
			responses.every((response: string, i: number) => responses.indexOf(response) === i)
	)

	const group = $derived(figure().demographic?.id ?? '')

	// A line chart starts with only its top `LINE_SERIES_DEFAULT` lines
	// drawn — everything past that is reachable, just unchecked to start.
	const defaultHidden = $derived(isLine ? responses.slice(LINE_SERIES_DEFAULT) : [])

	const hidden = $derived(dropped.group === group ? dropped.responses : defaultHidden)
	const focus = $derived(lit.group === group ? lit.responses : [])

	const kept = $derived(listable ? rows.filter((row: any) => !hidden.includes(row.response)) : rows)

	const without = (list: string[], response: string) => (list.includes(response) ? list.filter((r) => r !== response) : [...list, response])

	return {
		get rows() {
			return rows
		},
		get listable() {
			return listable
		},
		get hidden() {
			return hidden
		},
		get focus() {
			return focus
		},
		get kept() {
			return kept
		},
		/** The figure as the chart should draw it. */
		get shown() {
			// Untouched, a line chart passes its full series list through and
			// lets the chart apply its own default cap — so it can still tell
			// (and caption) how much its default left out.
			if (isLine) return dropped.group === group ? { ...figure(), series: kept.map((row: any) => row.response) } : figure()
			return hidden.length ? { ...figure(), data: kept } : figure()
		},
		get touched() {
			return hidden.length > 0 || focus.length > 0
		},

		toggle(response: string) {
			// Hiding the last visible row would leave nothing to draw.
			if (!hidden.includes(response) && kept.length <= 1) return
			dropped = { group, responses: without(hidden, response) }
		},

		// All shown -> hide everything but the first (one row must stay visible);
		// anything hidden (partial or full) -> show everything.
		toggleAll() {
			dropped = { group, responses: hidden.length === 0 ? responses.slice(1) : [] }
		},

		// Hiding a row drops its focus: a highlight on something undrawn would
		// leave the count saying one thing and the chart another.
		highlight(response: string) {
			lit = { group, responses: without(focus, response) }
			if (hidden.includes(response)) dropped = { group, responses: without(hidden, response) }
		},

		reset() {
			dropped = { group, responses: [] }
			lit = { group, responses: [] }
		},
	}
}

export type RowSelection = ReturnType<typeof rowSelection>
