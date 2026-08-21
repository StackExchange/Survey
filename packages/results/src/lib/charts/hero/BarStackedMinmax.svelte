<script lang="ts">
	// The two ends of the set as standing columns. Found here rather than authored,
	// so the sheet can promote a whole question and still get the comparison.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, endsOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { slab } from '$charts/utils/iso'
	import { chars, clip, descent, DIM, px, series, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 15

	const hover = useHover(() => onhover)

	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const ends = $derived(endsOf(rowsOf(figure), amount))

	const largest = $derived(largestOf(ends.map(amount)))

	const column = $derived(px(Math.min(width * 0.2, 210)))
	const depth = $derived(px(column * 0.72))
	const gap = $derived(px(column * 0.9))

	// Short enough that the tallest column, its lid and two label lines all fit.
	const plot = $derived(px(Math.min(width * 0.55, 560)))
	const height = $derived(plot + depth * 0.5 + LABEL_SIZE * 2.6 + 10 + descent(LABEL_SIZE))

	const y = $derived(scaleLinear().domain([0, largest]).range([0, plot]).clamp(true))

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), color: series(0) }] }, event)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 2)}>
	<!-- Right-hand column first: it is the shorter one, and it sits in front. -->
	{#each [...ends].reverse() as row, r (row.response ?? r)}
		{@const i = ends.length - 1 - r}
		{@const body = px(y(amount(row)))}
		{@const floor = px(plot + depth * 0.5)}
		{@const x = px(i * (column + gap))}
		{@const box = slab(x, floor - body, column, body, depth)}

		<g role="presentation" onpointermove={(event) => enter(i, row, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
			<!-- First child, so every label paints over it and stays selectable. The
			     handlers are on the group, so the whole row still answers the pointer. -->
			<rect {x} y={px(floor - body - box.rise)} width={px(Math.max(column + depth, HIT))} height={px(body + box.rise)} fill="transparent" />

			<g opacity={hover.active === null || hover.active === i ? 1 : DIM}>
				<path d={box.side} fill={theme.faceSide} />
				<path d={box.front} fill={series(0)} />
				<path d={box.top} fill={theme.faceTop} />
			</g>

			<text {x} y={px(floor + LABEL_SIZE + 10)} font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>{format(row)}</text>
			<text {x} y={px(floor + LABEL_SIZE * 2.6 + 10)} font-size={LABEL_SIZE} fill={theme.muted}>
				{clip(short(row.response), chars(column + gap, LABEL_SIZE))}
			</text>
		</g>
	{/each}
</Frame>
