<script lang="ts">
	// A column per response. One solid bar per value, so nothing reads as a second measurement.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, descent, px, series, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const GAP = 14
	const LABEL_SIZE = 12

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))
	const leader = $derived(rows.findIndex((row: any) => amount(row) === largest))
	// The sheet's `focus`, or the largest value where it named none. A focus is
	// drawn in the chapter's colour; the default accent keeps the palette's first.
	const focused = $derived(focusedOf(figure))
	const accent = $derived(focused ?? rows[leader])
	const accentFill = $derived(focused ? theme.focus : series(0))
	// Pointer first, then the accent: hovering any mark — the focused one included —
	// turns it black, and the accent is what is drawn when the pointer is elsewhere.
	// `ink`/`background` are a pair, so that reads black on a light page and white on
	// a dark one.
	const fillOf = (row: any, hovered: boolean) => (hovered ? theme.ink : row === accent ? accentFill : theme.faceSide)

	const plot = $derived(px(Math.min(width * 0.55, 420)))
	const height = $derived(plot + LABEL_SIZE * 2.2 + 6 + descent(LABEL_SIZE))

	const column = $derived(px((width - GAP * Math.max(rows.length - 1, 0)) / Math.max(rows.length, 1)))
	const y = $derived(scaleLinear().domain([0, largest]).range([0, plot]).clamp(true))

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: series(0) }] }, event)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	{#each rows as row, i (row.response ?? i)}
		{@const x = px(i * (column + GAP))}
		{@const body = px(y(amount(row)))}
		<!-- Baseline is plot, so the tallest column starts at 0. -->
		{@const top = px(plot - body)}

		<rect {x} y={top} width={column} height={body} fill={fillOf(row, hover.active === i)} />

		<text
			x={px(x + column / 2)}
			y={px(plot + LABEL_SIZE + 6)}
			text-anchor="middle"
			font-size={LABEL_SIZE}
			font-weight="600"
			fill={theme.ink}
		>
			{format(row)}
		</text>
		<text x={px(x + column / 2)} y={px(plot + LABEL_SIZE * 2.2 + 6)} text-anchor="middle" font-size={LABEL_SIZE} fill={theme.muted}>
			{clip(short(row.response), chars(column, LABEL_SIZE))}
		</text>

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
