<script lang="ts">
	// A prism on its side, length proportional to the share. Straight off the base
	// artwork: a bar split into a lit top and a shaded bottom half, a diamond tail
	// at the origin, and a pointed cap that rides the bar's own end. Nothing here
	// shears, so the geometry is four rects and three triangles rather than an
	// isometric projection.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, DIM, px, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// Artwork proportions: a 160-tall bar with a 30-wide tail and cap.
	const BAR = 96
	const NOSE = px(BAR * (30 / 160))
	const GAP = 20
	const LABEL_SIZE = 15

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))

	const x = $derived(
		scaleLinear()
			.domain([0, largest])
			.range([Math.max(width * 0.18, NOSE * 3), Math.max(width - NOSE, NOSE * 3)])
			.clamp(true)
	)

	const LEAD = px(LABEL_SIZE * 1.4)
	const height = $derived(LEAD + rows.length * (BAR + GAP) - GAP)
	const half = px(BAR / 2)
	const DIAMOND = `M0 ${-half}L${NOSE} 0L0 ${half}L${-NOSE} 0Z`
	const TAIL_TOP = `M0 ${-half}L${NOSE} 0H${-NOSE}Z`
	const TAIL_BOTTOM = `M0 ${half}L${NOSE} 0H${-NOSE}Z`
	const SHARE_Y = px(-half - 8)

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

		<g
			role="presentation"
			transform="translate(0 {px(LEAD + i * (BAR + GAP) + half)})"
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

			<text font-size={LABEL_SIZE} fill={theme.ink}>
				{clip(short(row.response), chars(width - 90, LABEL_SIZE))}
			</text>
			<text x={px(end + NOSE)} y={SHARE_Y} text-anchor="end" font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>
				{format(row)}
			</text>
		</g>
	{/each}
</Frame>
