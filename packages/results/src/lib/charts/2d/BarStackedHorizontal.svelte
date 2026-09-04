<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { CAPTION_SHARE, chars, clip, GAP, HIT, LABEL, LABEL_DY, px, shorten, textWidth, theme, VALUE } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const BAR = 44
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

	const named = $derived(accent ? clip(short(accent.response), chars(width * CAPTION_SHARE - VALUE_GAP, LABEL)) : '')
	const gutter = $derived(accent ? px(Math.max(textWidth(named, LABEL), textWidth(format(accent), VALUE)) + VALUE_GAP) : 0)

	const x = $derived(
		scaleLinear()
			.domain([0, largest])
			.range([0, Math.max(width - gutter, 1)])
			.clamp(true)
	)

	// Follows the focused bar's end. The gutter above guarantees the room.
	const captionX = $derived(accent ? px(Math.min(x(amount(accent)) + VALUE_GAP, width - (gutter - VALUE_GAP))) : 0)

	const height = $derived(rows.length * (BAR + GAP) - GAP)

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
		{@const y = px(i * (BAR + GAP))}
		{@const length = px(x(amount(row)))}

		<g
			role="presentation"
			onpointerdown={(event) => enter(i, row, event)}
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
		>
			<rect x="0" {y} {width} height={Math.max(BAR, HIT)} fill="transparent" />
			<rect x="0" {y} width={length} height={BAR} fill={fillOf(row, hover.active === i)} />

			{#if row === accent}
				<text x={captionX} y={px(y + VALUE_GAP + 4)} font-size={VALUE} font-family={theme.fontHeadline} font-weight="600" fill={theme.ink}>
					{format(row)}
				</text>
				<text x={captionX} y={px(y + VALUE_GAP + 4 + LABEL_DY)} font-size={LABEL} fill={theme.muted}>
					{named}
				</text>
			{/if}
		</g>
	{/each}
</Frame>
