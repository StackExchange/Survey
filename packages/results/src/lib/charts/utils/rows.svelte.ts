// Which responses an export draws, and which it brings forward.
//
// Owned here rather than in either component that needs it: the data table
// carries the controls, next to the numbers they act on, and ChartDownload reads
// the result to draw and to download. Call during component init.

export function rowSelection(figure: () => any) {
	// Keyed by group the way the page keys its own selection: responses differ
	// between cuts, so a row hidden in one would silently apply to another.
	let dropped = $state<{ group: string; responses: string[] }>({ group: '', responses: [] })
	let lit = $state<{ group: string; responses: string[] }>({ group: '', responses: [] })

	const rows = $derived((figure().data ?? []).filter(Boolean))
	const responses = $derived(rows.map((row: any) => row.response))

	// Hiding and focusing both work by response, so this is only offered where a
	// response identifies one row. A sankey's are {source, target, value}, and a
	// write-ins table repeats them once per use_type.
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

		// Hiding a row drops its focus too: a highlight on something that isn't
		// drawn would leave the count saying one thing and the chart another.
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
