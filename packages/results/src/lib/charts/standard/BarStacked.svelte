<script lang="ts">
	// The Likert shape. Rows arrive flat — one per (statement, segment) — and are
	// grouped into bars here. The export carries no offset column, so the running
	// sum that stacks the segments is computed rather than read.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { useFocus } from '$charts/utils/chrome'
	import {
		chars,
		clip,
		count,
		hanging,
		legend,
		middle,
		onSeries,
		PAD,
		percent,
		px,
		series,
		shorten,
		textWidth,
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

	const LABEL = 18
	const BAR = 25
	const GAP = 18
	const LABEL_SIZE = 13
	const VALUE_SIZE = 14

	let active = $state<number | null>(null)

	// One hit target per statement, not per segment: a 2% slice is a few pixels
	// wide, and it gives the narrow segments somewhere to show their label.
	const enter = (r: number, row: any, event: PointerEvent) => {
		active = r
		onhover?.(
			{
				title: String(row.response ?? ''),
				rows: row.segments.map((segment: any, i: number) => ({
					value: percent(segment.pct),
					label: segment.count ? `${labels[i]} · ${count(segment.count)}` : labels[i],
					color: series(i),
				})),
			},
			event
		)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}

	const short = $derived(shorten(figure))
	const names = $derived(figure.series ?? [])
	const labels = $derived(names.map(short))

	// Segments stack at the running sum of the ones before them — the export ships
	// no offset column, and computing it is cheaper than writing every row twice.
	const rows = $derived(
		bySeries(figure.data, names).map(({ response, cells }) => {
			let offset = 0

			return {
				response,
				segments: cells.map((cell: any) => {
					const pct = cell?.pct ?? 0
					const segment = { pct, count: cell?.count ?? null, offset }
					offset += pct
					return segment
				}),
			}
		})
	)

	const plotWidth = $derived(Math.max(1, width - PAD * 2))
	const key = $derived(legend(labels, plotWidth))

	// Segments are shares of the whole bar, so the domain is always 0–1.
	const x = $derived(scaleLinear().domain([0, 1]).range([0, plotWidth]).clamp(true))

	const height = $derived(PAD + key.height + rows.length * (LABEL + BAR + GAP) + PAD)
</script>

<Frame {figure} {width} {height}>
	<g transform="translate({PAD}, {PAD})">
		<Legend layout={key} colors={labels.map((_: string, i: number) => series(i))} />

		<Gridlines from={0} to={plotWidth} top={key.height} bottom={key.height + rows.length * (LABEL + BAR + GAP)} />

		{#each rows as row, r (row.response ?? r)}
			{@const y = key.height + r * (LABEL + BAR + GAP)}
			{@const band = LABEL + BAR + GAP / 2}
			<g
				opacity={dim(row.response)}
				role="presentation"
				onpointermove={(event) => enter(r, row, event)}
				onpointerleave={leave}
				onpointercancel={leave}
			>
				<!-- First child, so every label paints over it and stays selectable. The
				     handlers are on the group, so the whole row still answers the pointer. -->
				<rect x={-PAD} y={y - GAP / 4} width={plotWidth + PAD * 2} height={Math.max(band, HIT)} fill="transparent" />

				{#if active === r}
					<rect x={-PAD} y={y - GAP / 4} width={plotWidth + PAD * 2} height={band} fill={theme.ink} opacity="0.05" />
				{/if}

				<text y={hanging(y, LABEL_SIZE)} font-size={LABEL_SIZE} fill={theme.ink}>
					{clip(short(row.response), chars(plotWidth, LABEL_SIZE))}
				</text>

				{#each row.segments as segment, i (i)}
					{@const left = px(x(segment.offset))}
					{@const w = px(x(segment.pct))}
					{@const value = percent(segment.pct)}
					<rect x={left} y={y + LABEL} width={w} height={BAR} fill={series(i)} />

					<!-- Only where the segment can actually hold the label. -->
					{#if w >= textWidth(value, VALUE_SIZE) + 10}
						<text
							x={px(left + w / 2)}
							y={middle(y + LABEL + BAR / 2, VALUE_SIZE)}
							text-anchor="middle"
							font-size={VALUE_SIZE}
							font-weight="600"
							fill={onSeries(i)}
						>
							{value}
						</text>
					{/if}
				{/each}
			</g>
		{/each}
	</g>
</Frame>
