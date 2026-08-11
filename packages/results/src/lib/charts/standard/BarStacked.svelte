<script lang="ts">
	// The Likert shape. Rows carry parallel arrays — `percent[i]`, `offset[i]`,
	// `frequency[i]` — indexed against `metadata`, a plain array of segment labels.
	import { scaleLinear } from 'd3-scale'

	import Frame from '$charts/svg-components/SvgWrapper.svelte'
	import { useFocus } from '$charts/utils/chrome'
	import Legend from '$charts/svg-components/Legend.svelte'
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
				rows: (row.percent ?? []).map((share: number, i: number) => ({
					value: percent(share),
					label: row.frequency?.[i] ? `${labels[i]} · ${count(row.frequency[i])}` : labels[i],
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

	const rows = $derived((figure.data ?? []).filter(Boolean))
	const short = $derived(shorten(figure))
	const labels = $derived((figure.metadata ?? []).map(short))

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

				{#each row.percent ?? [] as share, i (i)}
					{@const left = px(x(row.offset?.[i] ?? 0))}
					{@const w = px(x(share ?? 0))}
					{@const value = percent(share)}
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
