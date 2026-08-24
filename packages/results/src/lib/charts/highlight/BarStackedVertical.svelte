<script lang="ts">
	// A column per response. No labels: the readout, the `<desc>` and the table
	// beside the chart carry the names and the numbers.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { px, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const GAP = 14

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))
	const leader = $derived(rows.findIndex((row: any) => amount(row) === largest))

	// The sheet's `focus`, or the largest value where it named none.
	const focused = $derived(focusedOf(figure))
	const accent = $derived(focused ?? rows[leader])
	const fillOf = (row: any, hovered: boolean) => (hovered ? theme.ink : row === accent ? theme.focus : theme.rest)

	const plot = $derived(px(Math.min(width * 0.7, 750)))
	const height = $derived(plot)

	const column = $derived(px((width - GAP * Math.max(rows.length - 1, 0)) / Math.max(rows.length, 1)))
	const y = $derived(scaleLinear().domain([0, largest]).range([0, plot]).clamp(true))

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(
			i,
			{ title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: theme.focus }] },
			event
		)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	{#each rows as row, i (row.response ?? i)}
		{@const x = px(i * (column + GAP))}
		{@const body = px(y(amount(row)))}
		{@const top = px(plot - body)}

		<rect {x} y={top} width={column} height={body} fill={fillOf(row, hover.active === i)} />

		<!-- The whole column band, so a short bar is still reachable. -->
		<rect
			{x}
			y="0"
			width={Math.max(column, HIT)}
			height={plot}
			fill="transparent"
			role="presentation"
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
		/>
	{/each}
</Frame>
