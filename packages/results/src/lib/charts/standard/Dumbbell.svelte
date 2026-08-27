<script lang="ts">
	// Two points per response with the gap drawn between them. Each value is
	// labelled on the outer side of its dot, so the two never collide.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { useDomain, useFocus } from '$charts/utils/chrome'
	import { useHover } from '$charts/utils/hover.svelte'
	import {
		chars,
		clip,
		digitsWidth,
		HOVER_WASH,
		labelGutter,
		labelsAbove,
		legend,
		middle,
		PAD,
		percent,
		px,
		shorten,
		theme,
	} from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'
	import { bySeries } from '$lib/table'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Legend from '$charts/svg/Legend.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// Dims every row but the focused ones. No-op unless an export asked for it.
	const dim = useFocus()
	const domain = useDomain()

	const DOT = 20
	const LABEL_SIZE = 16
	const VALUE_SIZE = 16
	const LINE = 20
	const TRACK = 30

	const hover = useHover(() => onhover)

	// The gap is the point of the chart, so the readout carries it as its own row.
	const enter = (i: number, row: any, event: PointerEvent) => {
		const gap = Math.round((row.b - row.a) * 100)
		hover.enter(
			i,
			{
				title: String(row.response ?? ''),
				rows: [
					{ value: format(row.a), label: first, color: theme.from },
					{ value: format(row.b), label: second, color: theme.to },
					{ value: `${gap > 0 ? '+' : ''}${gap} pts`, label: 'difference' },
				],
			},
			event
		)
	}

	const short = $derived(shorten(figure))

	// Exactly two series — the chart is the gap between them.
	const names = $derived(figure.series ?? [])
	const first = $derived(short(names[0] ?? ''))
	const second = $derived(short(names[1] ?? ''))

	// One row per response, carrying both ends.
	const rows = $derived(
		bySeries(figure.data, names).map(({ response, cells }) => ({
			response,
			a: cells[0]?.pct ?? 0,
			b: cells[1]?.pct ?? 0,
		}))
	)

	const format = (value: number) => percent(value)

	// Narrow: the label takes its own line, the track the full width below it.
	const labelAbove = $derived(labelsAbove(width, LABEL_SIZE))

	const labelWidth = $derived(labelGutter(width))
	const plotX = $derived(labelAbove ? 0 : labelWidth + 12)
	const plotWidth = $derived(Math.max(1, width - plotX - PAD))

	// Both ends inset enough to hold the widest label, so a dot at 0% or 100% can
	// still be labelled.
	const inset = $derived(
		Math.max(...rows.flatMap((row: any) => [digitsWidth(format(row.a), VALUE_SIZE), digitsWidth(format(row.b), VALUE_SIZE)]), 24) + DOT
	)

	const top = $derived(domain(rows.flatMap((row: any) => [row.a, row.b])))

	const x = $derived(
		scaleLinear()
			.domain([0, top])
			.range([plotX + inset, plotX + plotWidth - inset])
			.clamp(true)
	)

	const key = $derived(legend([first, second], Math.max(1, width - PAD * 2)))
	// Stacked rows carry a line of text above the track.
	const ROW = $derived(labelAbove ? LINE + TRACK : 30)
	const height = $derived(PAD + key.height + rows.length * ROW + PAD)

	const pair = [theme.from, theme.to]
</script>

<Frame {figure} {width} {height}>
	<g transform="translate({PAD}, {PAD})">
		<Legend layout={key} colors={pair} />
	</g>

	<Gridlines from={plotX + inset} to={plotX + plotWidth - inset} top={PAD + key.height} bottom={PAD + key.height + rows.length * ROW} />

	{#each rows as row, i (row.response ?? i)}
		{@const y = PAD + key.height + i * ROW}
		{@const mid = labelAbove ? y + LINE + TRACK / 2 : y + ROW / 2}
		{@const a = px(x(row.a))}
		{@const b = px(x(row.b))}
		{@const leading = row.a > row.b}
		<g
			opacity={dim(row.response)}
			role="presentation"
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
		>
			<!-- First child, so every label paints over it and stays selectable. The
			     handlers are on the group, so the whole row still answers the pointer. -->
			<rect x="0" y={y + (ROW - Math.max(ROW, HIT)) / 2} {width} height={Math.max(ROW, HIT)} fill="transparent" />

			<!-- Stacked, the track sits below its label line; wide, it centres the band. -->

			{#if hover.active === i}
				<rect x="0" {y} {width} height={ROW} fill={theme.ink} opacity={HOVER_WASH} />
			{/if}

			<text x={PAD} y={middle(labelAbove ? y + LINE / 2 : mid, LABEL_SIZE)} font-size={LABEL_SIZE} fill={theme.ink}>
				{clip(short(row.response), chars(labelAbove ? width : labelWidth, LABEL_SIZE))}
			</text>

			<rect width={Math.max(a, b) - Math.min(a, b)} x={Math.min(a, b)} y={mid - DOT / 2} height={DOT} fill={theme.rule} />

			<!-- Centred on the value, not hung off it: a marker's x/y is its corner. -->
			<rect x={px(a - DOT / 2)} y={mid - DOT / 2} width={DOT} height={DOT} fill={theme.from} />
			<text
				x={a}
				y={middle(mid, VALUE_SIZE)}
				dx={(leading ? 1 : -1) * (DOT / 2 + 5)}
				text-anchor={leading ? 'start' : 'end'}
				font-size={VALUE_SIZE}
				font-family={theme.fontHeadline}
				font-weight="600"
				fill={theme.ink}
			>
				{format(row.a)}
			</text>

			<rect x={px(b - DOT / 2)} y={mid - DOT / 2} width={DOT} height={DOT} fill={theme.to} />
			<text
				x={b}
				y={middle(mid, VALUE_SIZE)}
				dx={(leading ? -1 : 1) * (DOT / 2 + 7)}
				text-anchor={leading ? 'end' : 'start'}
				font-size={VALUE_SIZE}
				font-weight="600"
				font-family={theme.fontHeadline}
				fill={theme.ink}
			>
				{format(row.b)}
			</text>
		</g>
	{/each}
</Frame>
