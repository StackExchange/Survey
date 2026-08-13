<script lang="ts">
	// A group of bars per response, one per series. Plain groups against one set of scales — nesting a
	// Bar chart per group put an `<svg>` inside an `<svg>`.
	import { scaleLinear } from 'd3-scale'

	import Frame from '$charts/svg/Wrap.svelte'
	import { useDomain, useFocus } from '$charts/utils/chrome'
	import Legend from '$charts/svg/Legend.svelte'
	import {
		PAD,
		chars,
		clip,
		count,
		digitsWidth,
		labelGutter,
		legend,
		middle,
		percent,
		px,
		series,
		shorten,
		theme,
	} from '$charts/utils/theme'
	import { HIT, type OnHover } from '$charts/utils/tooltip'
	import { bySeries } from '$lib/table'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// Dims every row but the focused ones. No-op unless an export asked for it.
	const dim = useFocus()
	const domain = useDomain()

	const BAR = 16
	const BAR_GAP = 3
	const GROUP_GAP = 16
	const LABEL_SIZE = 13
	const VALUE_SIZE = 12

	let active = $state<number | null>(null)

	// The group is the target, so the readout compares the cuts side by side.
	const enter = (r: number, row: any, event: PointerEvent) => {
		active = r
		onhover?.(
			{
				title: String(row.response ?? ''),
				rows: cuts.map((cut: any, i: number) => ({ value: format(row, i), label: cut.label, color: series(i) })),
			},
			event
		)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}

	const short = $derived(shorten(figure))

	// One bar per series, in the order the export introduced them.
	const cuts: { key: string; label: string }[] = $derived((figure.series ?? []).map((name: string) => ({ key: name, label: short(name) })))

	// A salary-style question labels its bars with a named measure instead of a share.
	const value = $derived(figure.value ?? null)

	// One group per response, holding a cell per series.
	const rows = $derived(bySeries(figure.data, figure.series ?? []))

	const amount = (row: any, i: number) => (value ? (row.cells[i]?.[value.key] ?? 0) : (row.cells[i]?.pct ?? 0))
	const format = (row: any, i: number) => (value ? `${value.unit ?? ''}${count(amount(row, i))}` : percent(amount(row, i)))

	const labelWidth = $derived(labelGutter(width))
	const valueWidth = $derived(
		Math.ceil(Math.max(24, ...rows.flatMap((row: any) => cuts.map((_: any, i: number) => digitsWidth(format(row, i), VALUE_SIZE))))) + 12
	)
	const plotX = $derived(labelWidth + 12)
	const plotWidth = $derived(Math.max(1, width - plotX - valueWidth - PAD))

	// Every cut is a share of respondents, so all the bars read against one scale.
	const top = $derived(domain(rows.flatMap((row: any) => cuts.map((_: any, i: number) => amount(row, i)))))
	const x = $derived(scaleLinear().domain([0, top]).range([0, plotWidth]).clamp(true))

	const groupHeight = $derived(cuts.length * (BAR + BAR_GAP) + GROUP_GAP)

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

	{#each rows as row, r (row.response ?? r)}
		{@const y = PAD + key.height + r * groupHeight}
		<g opacity={dim(row.response)}>
			{#if active === r}
				<rect x="0" y={y - GROUP_GAP / 2} {width} height={groupHeight} fill={theme.ink} opacity="0.05" />
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
				{@const barY = y + i * (BAR + BAR_GAP)}
				{@const bar = px(x(amount(row, i)))}
				<rect x={plotX} y={barY} width={plotWidth} height={BAR} rx="2" fill={theme.tint} />
				<rect x={plotX} y={barY} width={bar} height={BAR} rx="2" fill={series(i)} />

				<text x={px(plotX + bar + 8)} y={middle(barY + BAR / 2, VALUE_SIZE)} font-size={VALUE_SIZE} font-weight="600" fill={theme.ink}>
					{format(row, i)}
				</text>
			{/each}

			<rect
				x="0"
				y={y - GROUP_GAP / 2}
				{width}
				height={Math.max(groupHeight, HIT)}
				fill="transparent"
				role="presentation"
				onpointermove={(event) => enter(r, row, event)}
				onpointerleave={leave}
				onpointercancel={leave}
			/>
		</g>
	{/each}
</Frame>
