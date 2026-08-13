<script lang="ts">
	// The Likert shape. Rows arrive flat — one per (statement, segment) — and are
	// grouped into bars here. The export carries no offset column, so the running
	// sum that stacks the segments is computed rather than read.
	import { scaleLinear } from 'd3-scale'

	import Frame from '$charts/svg/Wrap.svelte'
	import { useFocus } from '$charts/utils/chrome'
	import Legend from '$charts/svg/Legend.svelte'
	import {
		PAD,
		chars,
		clip,
		count,
		hanging,
		legend,
		middle,
		onSeries,
		percent,
		px,
		series,
		shorten,
		textWidth,
		theme,
	} from '$charts/utils/theme'
	import { HIT, type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// Dims every row but the focused ones. No-op unless an export asked for it.
	const dim = useFocus()

	const LABEL = 22
	const BAR = 20
	const GAP = 18
	const LABEL_SIZE = 13
	const VALUE_SIZE = 11

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

	// Rows arrive one per (statement, segment). Grouping keeps the order the export
	// wrote them in, and the offset each segment stacks at is the running sum of the
	// ones before it — the export ships no offset column.
	const rows = $derived.by(() => {
		const order: string[] = []
		const bySegment: Record<string, Record<string, any>> = {}

		for (const row of (figure.data ?? []).filter(Boolean)) {
			const response = String(row.response ?? '')
			if (!bySegment[response]) {
				bySegment[response] = {}
				order.push(response)
			}
			bySegment[response][String(row.series ?? '')] = row
		}

		return order.map((response) => {
			const found = bySegment[response]
			let offset = 0

			const segments = names.map((name: string) => {
				const pct = found[name]?.pct ?? 0
				const segment = { pct, count: found[name]?.count ?? null, offset }
				offset += pct
				return segment
			})

			return { response, segments }
		})
	})

	const plotWidth = $derived(Math.max(1, width - PAD * 2))
	const key = $derived(legend(labels, plotWidth))

	// Segments are shares of the whole bar, so the domain is always 0–1.
	const x = $derived(scaleLinear().domain([0, 1]).range([0, plotWidth]).clamp(true))

	const height = $derived(PAD + key.height + rows.length * (LABEL + BAR + GAP) + PAD)
</script>

<Frame {figure} {width} {height}>
	<g transform="translate({PAD}, {PAD})">
		<Legend layout={key} colors={labels.map((_: string, i: number) => series(i))} />

		{#each rows as row, r (row.response ?? r)}
			{@const y = key.height + r * (LABEL + BAR + GAP)}
			{@const band = LABEL + BAR + GAP / 2}
			<g opacity={dim(row.response)}>
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

				<rect
					x={-PAD}
					y={y - GAP / 4}
					width={plotWidth + PAD * 2}
					height={Math.max(band, HIT)}
					fill="transparent"
					role="presentation"
					onpointermove={(event) => enter(r, row, event)}
					onpointerleave={leave}
					onpointercancel={leave}
				/>
			</g>
		{/each}
	</g>
</Frame>
