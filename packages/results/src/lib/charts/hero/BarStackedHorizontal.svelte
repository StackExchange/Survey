<script lang="ts">
	// Slabs on their side, length proportional to the share. Depth is constant, or
	// they stop reading as one solid seen from one angle.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { SKEW, slab } from '$charts/utils/iso'
	import { chars, clip, DIM, px, series, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const BAR = 62
	const GAP = 46
	const LABEL_SIZE = 15

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))
	// Nothing else here is accented, so a focused bar takes a colour of its own.
	const focused = $derived(focusedOf(figure))

	const depth = $derived(px(BAR * 0.62))
	// The longest bar plus its end cap has to land inside the width.
	const plot = $derived(Math.max(1, width - depth))
	const x = $derived(
		scaleLinear()
			.domain([0, largest])
			.range([width * 0.18, plot])
			.clamp(true)
	)

	// Bar, lid behind it, label above that — or the first row's label lands off the
	// top of the box.
	const LEAD = $derived(px(LABEL_SIZE * 1.4 + depth * SKEW))
	const height = $derived(LEAD + rows.length * (BAR + GAP) - GAP)

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: series(4) }] }, event)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	{#each rows as row, i (row.response ?? i)}
		{@const length = px(x(amount(row)))}
		{@const y = px(LEAD + i * (BAR + GAP))}
		{@const box = slab(0, y, length, BAR, depth)}

		<g role="presentation" onpointermove={(event) => enter(i, row, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
			<!-- First child, so every label paints over it and stays selectable. The
			     handlers are on the group, so the whole row still answers the pointer. -->
			<rect x="0" y={px(y - box.rise)} width={px(Math.max(length + depth, HIT))} height={px(BAR + box.rise)} fill="transparent" />

			<g opacity={hover.active === null || hover.active === i ? 1 : DIM}>
				<path d={box.top} fill={series(4)} />
				<path d={box.front} fill={row === focused ? theme.focus : series(0)} />
				<path d={box.side} fill={theme.faceTop} />
			</g>

			<!-- Above its own bar: a row this deep has no gutter to put a label in, and
			     the responses here are whole phrases. -->
			<text x="0" y={px(y - box.rise - 8)} font-size={LABEL_SIZE} fill={theme.muted}>
				{clip(short(row.response), chars(width - 90, LABEL_SIZE))}
			</text>
			<text x={px(length + depth)} y={px(y - box.rise - 8)} text-anchor="end" font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>
				{format(row)}
			</text>
		</g>
	{/each}
</Frame>
