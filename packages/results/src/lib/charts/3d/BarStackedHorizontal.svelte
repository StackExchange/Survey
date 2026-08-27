<script lang="ts">
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { CAPTION_SHARE, chars, clip, DIM, LABEL, LABEL_DY, px, shorten, textWidth, theme, VALUE } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const BAR = 96
	const NOSE = px(BAR * (30 / 160))
	const ROW_GAP = 20
	const VALUE_GAP = 16

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))

	const named = (row: any) => clip(short(row.response), chars(width * CAPTION_SHARE - VALUE_GAP, LABEL))

	// Every row carries its own caption, so the gutter is the widest of them.
	const gutter = $derived(
		rows.reduce((room: number, row: any) => Math.max(room, textWidth(named(row), LABEL), textWidth(format(row), VALUE)), 0) + VALUE_GAP
	)

	const x = $derived(
		scaleLinear()
			.domain([0, largest])
			.range([Math.max(width * 0.18, NOSE * 3), Math.max(width - NOSE - gutter, NOSE * 3)])
			.clamp(true)
	)

	const height = $derived(rows.length * (BAR + ROW_GAP) - ROW_GAP)
	const half = px(BAR / 2)
	const DIAMOND = `M0 ${-half}L${NOSE} 0L0 ${half}L${-NOSE} 0Z`
	const TAIL_TOP = `M0 ${-half}L${NOSE} 0H${-NOSE}Z`
	const TAIL_BOTTOM = `M0 ${half}L${NOSE} 0H${-NOSE}Z`

	const valueY = -2
	const labelY = valueY + LABEL_DY

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
		{@const end = px(x(amount(row)))}
		{@const body = px(end - NOSE)}
		{@const captionX = px(Math.min(end + NOSE + VALUE_GAP, width - (gutter - VALUE_GAP)))}

		<g
			role="presentation"
			transform="translate(0 {px(i * (BAR + ROW_GAP) + half)})"
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
		>
			<rect x="0" y={-half} width={px(Math.max(end + NOSE, HIT))} height={px(BAR)} fill="transparent" />

			<g opacity={hover.active === null || hover.active === i ? 1 : DIM}>
				<rect x={NOSE} y={-half} width={body} height={half} fill={theme.focus} />
				<path d={TAIL_TOP} transform="translate({NOSE} 0)" fill={theme.focus} />

				<rect x={NOSE} y="0" width={body} height={half} fill={theme.rest} />
				<path d={TAIL_BOTTOM} transform="translate({NOSE} 0)" fill={theme.rest} />

				<path d={DIAMOND} transform="translate({end} 0)" fill={theme.accent} />
			</g>

			<text x={captionX} y={valueY} font-size={VALUE} font-family={theme.fontHeadline} font-weight="600" fill={theme.ink}>
				{format(row)}
			</text>
			<text x={captionX} y={labelY} font-size={LABEL} fill={theme.muted}>
				{named(row)}
			</text>
		</g>
	{/each}
</Frame>
