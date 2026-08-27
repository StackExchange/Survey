<script lang="ts">
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, descent, GAP, LABEL, LABEL_DY, px, shorten, textWidth, theme, VALUE } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const VALUE_GAP = 16

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))
	const short = $derived(shorten(figure))

	const largest = $derived(largestOf(rows.map(amount)))
	const leader = $derived(rows.findIndex((row: any) => amount(row) === largest))

	const focused = $derived(focusedOf(figure))
	const accent = $derived(focused ?? rows[leader])
	const fillOf = (row: any, hovered: boolean) => (hovered ? theme.ink : row === accent ? theme.focus : theme.rest)

	const plot = $derived(px(Math.min(width * 0.7, 750)))

	const valueY = $derived(px(plot + VALUE_GAP + VALUE))
	const labelY = $derived(px(valueY + LABEL_DY))
	const height = $derived(labelY + descent(LABEL))

	const column = $derived(px((width - GAP * Math.max(rows.length - 1, 0)) / Math.max(rows.length, 1)))
	const y = $derived(scaleLinear().domain([0, largest]).range([0, plot]).clamp(true))

	const caption = $derived(Math.max(rows.indexOf(accent), 0) * (column + GAP))
	const named = $derived(accent ? clip(short(accent.response), chars(width, LABEL)) : '')
	const captionX = $derived(px(Math.max(0, Math.min(caption, width - textWidth(named, LABEL)))))

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
		<text x={captionX} y={valueY} font-size={VALUE} font-family={theme.fontHeadline} font-weight="600" fill={theme.ink}>
			{format(accent)}
		</text>
		<text x={captionX} y={labelY} font-size={LABEL} fill={theme.muted}>
			{named}
		</text>
	{/if}
</Frame>
