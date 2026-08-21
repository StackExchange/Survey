<script lang="ts">
	// A group of bars per response, one per series. Plain groups against one set of scales — nesting a
	// Bar chart per group put an `<svg>` inside an `<svg>`.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { useDomain, useFocus } from '$charts/utils/chrome'
	import { amountOf, formatOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, digitsWidth, HOVER_WASH, labelGutter, legend, middle, PAD, px, series, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'
	import { bySeries } from '$lib/table'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Legend from '$charts/svg/Legend.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// Dims every row but the focused ones. No-op unless an export asked for it.
	const dim = useFocus()
	const domain = useDomain()

	const BAR = 20
	const GROUP_GAP = 16
	const LABEL_SIZE = 13
	const VALUE_SIZE = 13

	const hover = useHover(() => onhover)

	// The group is the target, so the readout compares the cuts side by side.
	const enter = (r: number, row: any, event: PointerEvent) => {
		hover.enter(
			r,
			{
				title: String(row.response ?? ''),
				rows: cuts.map((cut: any, i: number) => ({ value: format(row, i), label: cut.label, color: series(i) })),
			},
			event
		)
	}

	const short = $derived(shorten(figure))

	// One bar per series, in the order the export introduced them.
	const cuts: { key: string; label: string }[] = $derived((figure.series ?? []).map((name: string) => ({ key: name, label: short(name) })))

	// One group per response, holding a cell per series.
	const rows = $derived(bySeries(figure.data, figure.series ?? []))

	// A group holds one cell per series, so the measure is read off the cell.
	const cell = (row: any, i: number) => row.cells[i]
	const amount = $derived(amountOf(figure, cell))
	const format = $derived(formatOf(figure, cell))

	const labelWidth = $derived(labelGutter(width))
	const valueWidth = $derived(
		Math.ceil(Math.max(24, ...rows.flatMap((row: any) => cuts.map((_: any, i: number) => digitsWidth(format(row, i), VALUE_SIZE))))) + 12
	)
	const plotX = $derived(labelWidth + 12)
	const plotWidth = $derived(Math.max(1, width - plotX - valueWidth - PAD))

	// Every cut is a share of respondents, so all the bars read against one scale.
	const top = $derived(domain(rows.flatMap((row: any) => cuts.map((_: any, i: number) => amount(row, i)))))
	const x = $derived(scaleLinear().domain([0, top]).range([0, plotWidth]).clamp(true))

	const groupHeight = $derived(cuts.length * BAR + GROUP_GAP)

	const key = $derived(
		legend(
			cuts.map((cut) => cut.label),
			Math.max(1, width - PAD * 2)
		)
	)
	const height = $derived(PAD + key.height + rows.length * groupHeight + PAD)
</script>

<Frame {figure} {width} {height}>
	<g transform="translate({PAD}, {PAD})">
		<Legend layout={key} colors={cuts.map((_, i) => series(i))} />
	</g>

	<Gridlines from={plotX} to={plotX + plotWidth} top={PAD + key.height} bottom={PAD + key.height + rows.length * groupHeight} />

	{#each rows as row, r (row.response ?? r)}
		{@const y = PAD + key.height + r * groupHeight}
		<g
			opacity={dim(row.response)}
			role="presentation"
			onpointermove={(event) => enter(r, row, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
		>
			<!-- First child, so every label paints over it and stays selectable. The
			     handlers are on the group, so the whole row still answers the pointer. -->
			<rect x="0" y={y - GROUP_GAP / 2} {width} height={Math.max(groupHeight, HIT)} fill="transparent" />

			{#if hover.active === r}
				<rect x="0" y={y - GROUP_GAP / 2} {width} height={groupHeight} fill={theme.ink} opacity={HOVER_WASH} />
			{/if}

			<text
				x={labelWidth}
				y={middle(y + (groupHeight - GROUP_GAP) / 2, LABEL_SIZE)}
				text-anchor="end"
				font-size={LABEL_SIZE}
				fill={theme.ink}
			>
				{clip(short(row.response), chars(labelWidth, LABEL_SIZE))}
			</text>

			{#each cuts as cut, i (cut.key)}
				{@const barY = y + i * BAR}
				{@const bar = px(x(amount(row, i)))}

				<rect x={plotX} y={barY} width={bar} height={BAR} fill={series(i)} />
				<text x={px(plotX + bar + 8)} y={middle(barY + BAR / 2, VALUE_SIZE)} font-size={VALUE_SIZE} font-weight="600" fill={theme.ink}>
					{format(row, i)}
				</text>
			{/each}
		</g>
	{/each}
</Frame>
