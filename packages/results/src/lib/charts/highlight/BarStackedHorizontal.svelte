<script lang="ts">
	// A row per response, length proportional to the share. Only the focused row is
	// named, in a gutter before the bars: the readout, the `<desc>` and the table
	// beside the chart carry the rest.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, GAP, px, shorten, textWidth, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const BAR = 44
	const LABEL_SIZE = 16
	const UNIT_SIZE = 18
	// The gutter never takes more than this much of the frame, however long the label.
	const CAPTION = 0.4

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

	// Clipped to the room it is allowed first, then the gutter measured from what is
	// left, so the bars start after the longest line rather than under it.
	const named = $derived(accent ? clip(short(accent.response), chars(width * CAPTION - 16, LABEL_SIZE)) : '')
	const gutter = $derived(accent ? px(Math.max(textWidth(named, LABEL_SIZE), textWidth(format(accent), UNIT_SIZE)) + 16) : 0)

	const x = $derived(
		scaleLinear()
			.domain([0, largest])
			.range([0, Math.max(width - gutter, 1)])
			.clamp(true)
	)

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

		<g role="presentation" onpointermove={(event) => enter(i, row, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
			<rect x="0" {y} {width} height={Math.max(BAR, HIT)} fill="transparent" />
			<rect x={gutter} {y} width={length} height={BAR} fill={fillOf(row, hover.active === i)} />

			<!-- Pinned to the row it names, right-aligned so it ends where the bars begin. -->
			{#if row === accent}
				<text
					x={px(gutter - 12)}
					y={px(y + 20)}
					text-anchor="end"
					font-size={UNIT_SIZE}
					font-family={theme.fontHeadline}
					font-weight="600"
					fill={theme.ink}
				>
					{format(row)}
				</text>
				<text x={px(gutter - 12)} y={px(y + 38)} text-anchor="end" font-size={LABEL_SIZE} fill={theme.muted}>
					{named}
				</text>
			{/if}
		</g>
	{/each}
</Frame>
