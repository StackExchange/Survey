<script lang="ts">
	// A column per response. Only the focused one is named, below the plot: the
	// readout, the `<desc>` and the table beside the chart carry the rest.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, descent, GAP, px, shorten, textWidth, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 16
	const UNIT_SIZE = 28

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))
	const short = $derived(shorten(figure))

	const largest = $derived(largestOf(rows.map(amount)))
	const leader = $derived(rows.findIndex((row: any) => amount(row) === largest))

	// The sheet's `focus`, or the largest value where it named none.
	const focused = $derived(focusedOf(figure))
	const accent = $derived(focused ?? rows[leader])
	const fillOf = (row: any, hovered: boolean) => (hovered ? theme.ink : row === accent ? theme.focus : theme.rest)

	const plot = $derived(px(Math.min(width * 0.7, 750)))

	const CAPTION = UNIT_SIZE + LABEL_SIZE + 22
	const height = $derived(plot + CAPTION + descent(LABEL_SIZE))

	const column = $derived(px((width - GAP * Math.max(rows.length - 1, 0)) / Math.max(rows.length, 1)))
	const y = $derived(scaleLinear().domain([0, largest]).range([0, plot]).clamp(true))

	const caption = $derived(Math.max(rows.indexOf(accent), 0) * (column + GAP))
	const named = $derived(accent ? clip(short(accent.response), chars(width, LABEL_SIZE)) : '')
	const captionX = $derived(px(Math.max(0, Math.min(caption, width - textWidth(named, LABEL_SIZE)))))

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

	{#if accent}
		<text
			x={captionX}
			y={px(plot + UNIT_SIZE + 12)}
			font-size={UNIT_SIZE}
			font-family={theme.fontHeadline}
			font-weight="600"
			fill={theme.ink}
		>
			{format(accent)}
		</text>
		<text x={captionX} y={px(plot + UNIT_SIZE + LABEL_SIZE + 18)} font-size={LABEL_SIZE} fill={theme.ink}>
			{named}
		</text>
	{/if}
</Frame>
