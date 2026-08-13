<script lang="ts">
	// A group of bars per response, one per series, discovered from `metadata` as
	// `percent1`, `percent2`, … Plain groups against one set of scales — nesting a
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
				rows: cuts.map((cut, i) => ({ value: format(row, cut.key), label: cut.label, color: series(i) })),
			},
			event
		)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}

	const rows = $derived((figure.data ?? []).filter(Boolean))
	const short = $derived(shorten(figure))

	// `percent1`, `percent2`, … in index order, each with the label it was given.
	const cuts = $derived(
		Object.keys(figure.metadata ?? {})
			.filter((key) => /^percent\d+$/.test(key))
			.sort()
			.map((key) => ({ key, label: figure.metadata[key]?.label ?? key }))
	)

	// A salary-style question labels its bars with a named value instead of a share.
	const value = $derived(figure.metadata?.label ?? null)
	const amount = (row: any, cut: string) => row[cut] ?? 0
	const format = (row: any, cut: string) => (value ? `${value.unit ?? ''}${count(row[value.key])}` : percent(amount(row, cut)))

	const labelWidth = $derived(labelGutter(width))
	const valueWidth = $derived(
		Math.ceil(Math.max(24, ...rows.flatMap((row: any) => cuts.map((cut) => digitsWidth(format(row, cut.key), VALUE_SIZE))))) + 12
	)
	const plotX = $derived(labelWidth + 12)
	const plotWidth = $derived(Math.max(1, width - plotX - valueWidth - PAD))

	// Every cut is a share of respondents, so all the bars read against one scale.
	const top = $derived(domain(rows.flatMap((row: any) => cuts.map((cut) => amount(row, cut.key)))))
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
				{@const bar = px(x(amount(row, cut.key)))}
				<rect x={plotX} y={barY} width={plotWidth} height={BAR} rx="2" fill={theme.tint} />
				<rect x={plotX} y={barY} width={bar} height={BAR} rx="2" fill={series(i)} />

				<text x={px(plotX + bar + 8)} y={middle(barY + BAR / 2, VALUE_SIZE)} font-size={VALUE_SIZE} font-weight="600" fill={theme.ink}>
					{format(row, cut.key)}
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
