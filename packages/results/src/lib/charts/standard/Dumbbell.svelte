<script lang="ts">
	// Two points per response with the gap drawn between them. Each value is
	// labelled on the outer side of its dot, so the two never collide.
	import type { OnHover } from '$charts/utils/theme'

	import { scaleLinear } from 'd3-scale'

	import { useDomain, useFocus } from '$charts/utils/chrome'
	import { useHover } from '$charts/utils/hover.svelte'
	import {
		chars,
		clip,
		digitsWidth,
		HIT,
		HOVER_WASH,
		LABEL,
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
	import { bySeries } from '$lib/table'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Legend from '$charts/svg/Legend.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// No-op unless an export asked for a focus.
	const dim = useFocus()
	const domain = useDomain()

	const DOT = 20
	const LINE = 20
	const TRACK = 30
	// Clear of the dot, on whichever side the value is labelled.
	const VALUE_GAP = 6

	const hover = useHover(() => onhover)

	const short = $derived(shorten(figure))

	const names = $derived(figure.series ?? [])
	const first = $derived(short(names[0] ?? ''))
	const second = $derived(short(names[1] ?? ''))

	const rows = $derived(
		bySeries(figure.data, names).map(({ response, cells }) => ({
			response,
			a: cells[0]?.pct ?? 0,
			b: cells[1]?.pct ?? 0,
		}))
	)

	const format = (value: number) => percent(value)

	// Narrow: the label takes its own line, the track the full width below it.
	const labelAbove = $derived(labelsAbove(width, LABEL))

	const labelWidth = $derived(labelGutter(width))
	const plotX = $derived(labelAbove ? 0 : labelWidth + 12)
	const plotWidth = $derived(Math.max(1, width - plotX - PAD))

	// Both ends inset enough to hold the widest label, so a dot at 0% or 100% can
	// still be labelled.
	const inset = $derived(
		Math.max(...rows.flatMap((row: any) => [digitsWidth(format(row.a), LABEL), digitsWidth(format(row.b), LABEL)]), 24) + DOT
	)

	const top = $derived(domain(rows.flatMap((row: any) => [row.a, row.b])))

	const x = $derived(
		scaleLinear()
			.domain([0, top])
			.range([plotX + inset, plotX + plotWidth - inset])
			.clamp(true)
	)

	const key = $derived(legend([first, second], Math.max(1, width - PAD * 2)))
	const ROW = $derived(labelAbove ? LINE + TRACK : TRACK)
	const height = $derived(PAD + key.height + rows.length * ROW + PAD)

	const pair = [theme.from, theme.to]

	// The gap is the point of the chart, so the readout carries it as a row.
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
			<!-- Hit target first, so labels stay selectable. -->
			<rect x="0" y={y + (ROW - Math.max(ROW, HIT)) / 2} {width} height={Math.max(ROW, HIT)} fill="transparent" />

			{#if hover.active === i}
				<rect x="0" {y} {width} height={ROW} fill={theme.ink} opacity={HOVER_WASH} />
			{/if}

			<text x={PAD} y={middle(labelAbove ? y + LINE / 2 : mid, LABEL)} font-size={LABEL} fill={theme.ink}>
				{clip(short(row.response), chars(labelAbove ? width : labelWidth, LABEL))}
			</text>

			<rect width={Math.max(a, b) - Math.min(a, b)} x={Math.min(a, b)} y={mid - DOT / 2} height={DOT} fill={theme.rule} />

			<!-- Centred on the value, not hung off it: a marker's x/y is its corner. -->
			<rect x={px(a - DOT / 2)} y={mid - DOT / 2} width={DOT} height={DOT} fill={theme.from} />
			<text
				x={a}
				y={middle(mid, LABEL)}
				dx={(leading ? 1 : -1) * (DOT / 2 + VALUE_GAP)}
				text-anchor={leading ? 'start' : 'end'}
				font-size={LABEL}
				font-family={theme.fontHeadline}
				font-weight="600"
				fill={theme.ink}
			>
				{format(row.a)}
			</text>

			<rect x={px(b - DOT / 2)} y={mid - DOT / 2} width={DOT} height={DOT} fill={theme.to} />
			<text
				x={b}
				y={middle(mid, LABEL)}
				dx={(leading ? -1 : 1) * (DOT / 2 + VALUE_GAP)}
				text-anchor={leading ? 'end' : 'start'}
				font-size={LABEL}
				font-weight="600"
				font-family={theme.fontHeadline}
				fill={theme.ink}
			>
				{format(row.b)}
			</text>
		</g>
	{/each}
</Frame>
