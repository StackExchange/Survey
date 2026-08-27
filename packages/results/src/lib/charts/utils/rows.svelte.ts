// Held by ChartDownload: ChartOptions sets it and the drawing reads it.

export function rowSelection(figure: () => any) {
	// Keyed by group: responses differ between cuts, so a row hidden in one
	// would silently apply to another.
	let dropped = $state<{ group: string; responses: string[] }>({ group: '', responses: [] })
	let lit = $state<{ group: string; responses: string[] }>({ group: '', responses: [] })

	const rows = $derived((figure().data ?? []).filter(Boolean))
	const responses = $derived(rows.map((row: any) => row.response))

	// Only where a response identifies one row: a sankey's are {source, target,
	// value}, and a write-ins table repeats them once per use_type.
	const listable = $derived(
		rows.length > 1 &&
			responses.every((response: unknown) => typeof response === 'string') &&
			responses.every((response: string, i: number) => responses.indexOf(response) === i)
	)

	const group = $derived(figure().demographic?.id ?? '')
	const hidden = $derived(dropped.group === group ? dropped.responses : [])
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
			return hidden.length ? { ...figure(), data: kept } : figure()
		},
		get touched() {
			return hidden.length > 0 || focus.length > 0
		},

		toggle(response: string) {
			dropped = { group, responses: without(hidden, response) }
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
