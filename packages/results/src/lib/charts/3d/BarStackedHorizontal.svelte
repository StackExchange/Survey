<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, formatOf, largestOf, NOSE_RISE, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { CAPTION_SHARE, chars, clip, HIT, LABEL, LABEL_DY, px, shorten, textWidth, theme, VALUE } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const BAR = 96
	// The same pointed cap as the column bar, quarter-turned for a bar that runs
	// across the page. `half` is the bar's half-thickness, `nose` how far the point
	// juts past the body.
	const capRow = (half: number, nose: number) => ({
		face: `M0 ${-half}L${nose} 0L0 ${half}L${-nose} 0Z`,
		top: `M0 ${-half}L${nose} 0H${-nose}Z`,
		bottom: `M0 ${half}L${nose} 0H${-nose}Z`,
	})

	const NOSE = px(BAR * NOSE_RISE)
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
	const CAP = capRow(half, NOSE)

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
			onpointerdown={(event) => enter(i, row, event)}
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
		>
			<rect x="0" y={-half} width={px(Math.max(end + NOSE, HIT))} height={px(BAR)} fill="transparent" />

			<rect x={NOSE} y={-half} width={body} height={half} fill={theme.focus} />
			<path d={CAP.top} transform="translate({NOSE} 0)" fill={theme.focus} />

			<rect x={NOSE} y="0" width={body} height={half} fill={theme.rest} />
			<path d={CAP.bottom} transform="translate({NOSE} 0)" fill={theme.rest} />

			<path d={CAP.face} transform="translate({end} 0)" fill={theme.accent} />

			<text x={captionX} y={valueY} font-size={VALUE} font-family={theme.fontHeadline} font-weight="600" fill={theme.ink}>
				{format(row)}
			</text>
			<text x={captionX} y={labelY} font-size={LABEL} fill={theme.muted}>
				{named(row)}
			</text>
		</g>
	{/each}
</Frame>
