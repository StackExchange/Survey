<script lang="ts">
	// Density is opacity on one hue, not an interpolated ramp: the palette is
	// `var()` tokens and d3 can only interpolate literal colours.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { chars, clip, count, middle, PAD, px, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	let active = $state<number | null>(null)

	// Two scatters on one page would otherwise share a gradient id.
	const uid = $props.id()

	const RAMP_WIDTH = 96
	const AXIS_LEFT = 76
	const AXIS_BOTTOM = 64
	const TICK_SIZE = 11
	const LABEL_SIZE = 12

	const rows = $derived((figure.data ?? []).filter(Boolean))
	// Which two of the row's named columns to plot, resolved by the loader — the
	// export names its columns and says nothing about where they belong.
	const axes = $derived(figure.axes ?? null)
	const short = $derived(shorten(figure))

	const valueAt = (row: any, axis: any) => (axis ? (row?.[axis.key] ?? 0) : 0)

	const plotWidth = $derived(Math.max(1, width - AXIS_LEFT - RAMP_WIDTH - PAD))
	// An aspect ratio, not a fixed height: how steep the cloud looks is part of
	// what a scatter says.
	const plotHeight = $derived(Math.round(plotWidth * 0.75))
	const height = $derived(PAD + plotHeight + AXIS_BOTTOM)
	const rampHeight = $derived(Math.round(plotHeight * 0.4))

	const span = (values: number[]) => {
		const min = Math.min(...values)
		const max = Math.max(...values)
		// A single distinct value would collapse the scale to a point.
		return min === max ? [min - 1, max + 1] : [min, max]
	}

	const xScale = $derived(
		scaleLinear()
			.domain(span(rows.map((row: any) => valueAt(row, axes?.x))))
			.range([0, plotWidth])
			.nice()
	)
	const yScale = $derived(
		scaleLinear()
			.domain(span(rows.map((row: any) => valueAt(row, axes?.y))))
			.range([plotHeight, 0])
			.nice()
	)

	const frequencies = $derived(rows.map((row: any) => row.count ?? 0))
	const opacity = $derived(scaleLinear().domain(span(frequencies)).range([0.3, 1]).clamp(true))

	// '$' reads before the number, '%' after it — prefixing both gives "%10".
	const tick = (value: number, axis: any) => {
		if (axis?.unit === '$') return `$${count(value)}`
		return `${value}${axis?.unit === '%' ? '%' : ''}`
	}

	const DOT = 6
	// Gap from a point to its name, and the line spacing a nudged name drops by.
	const GUTTER = DOT + 9
	const LINE = TICK_SIZE + 2

	// A name sits beside its point, flipping inside near the right edge. Collisions
	// nudge down a line, walked in y order so a nudge only pushes into free space.
	const points = $derived.by(() => {
		const placed = rows
			.map((row: any) => {
				const cx = px(xScale(valueAt(row, axes?.x)))
				const flip = cx > plotWidth * 0.72
				// Clipped to the room beside the point, which varies by position.
				return { row, cx, cy: px(yScale(valueAt(row, axes?.y))), flip, room: (flip ? cx : plotWidth - cx) - GUTTER }
			})
			.sort((a: any, b: any) => a.cy - b.cy)

		const lowest: Record<string, number> = {}
		for (const point of placed) {
			const side = point.flip ? 'left' : 'right'
			const floor = lowest[side] ?? -Infinity
			;(point as any).labelY = point.cy < floor + LINE ? floor + LINE : point.cy
			lowest[side] = (point as any).labelY
		}

		return placed
	})

	// Opacity is the one encoding a reader cannot put a number to, so the count
	// leads the readout.
	const enter = (i: number, row: any, event: PointerEvent) => {
		active = i
		onhover?.(
			{
				title: String(row.response ?? ''),
				rows: [
					{ value: tick(valueAt(row, axes?.y), axes?.y), label: axes?.y?.label, color: theme.from },
					{ value: tick(valueAt(row, axes?.x), axes?.x), label: axes?.x?.label },
					{ value: count(row.count), label: 'respondents' },
				],
			},
			event
		)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}
</script>

<Frame {figure} {width} {height}>
	<g transform="translate({AXIS_LEFT}, {PAD})">
		{#each xScale.ticks(6) as value (value)}
			{@const at = px(xScale(value))}
			<line x1={at} x2={at} y1="0" y2={plotHeight} stroke={theme.rule} stroke-dasharray="1, 2" vector-effect="non-scaling-stroke" />
			<text x={at} y={plotHeight + 18} text-anchor="middle" font-size={TICK_SIZE} fill={theme.muted}>
				{tick(value, axes?.x)}
			</text>
		{/each}

		{#each yScale.ticks(6) as value (value)}
			{@const at = px(yScale(value))}
			<line x1="0" x2={plotWidth} y1={at} y2={at} stroke={theme.rule} stroke-dasharray="1, 2" vector-effect="non-scaling-stroke" />
			<text x="-10" y={middle(at, TICK_SIZE)} text-anchor="end" font-size={TICK_SIZE} fill={theme.muted}>
				{tick(value, axes?.y)}
			</text>
		{/each}

		{#if axes?.x?.label}
			<text x={plotWidth / 2} y={plotHeight + 46} text-anchor="middle" font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>
				{clip(String(axes.x.label), chars(plotWidth, LABEL_SIZE))}
			</text>
		{/if}
		{#if axes?.y?.label}
			<text
				text-anchor="middle"
				font-size={LABEL_SIZE}
				font-weight="600"
				fill={theme.ink}
				transform="translate(-56, {plotHeight / 2}) rotate(-90)"
			>
				{clip(String(axes.y.label), chars(plotHeight, LABEL_SIZE))}
			</text>
		{/if}

		{#each points as point, i (point.row.response ?? i)}
			{@const side = point.flip ? -1 : 1}
			<g role="presentation" onpointermove={(event) => enter(i, point.row, event)} onpointerleave={leave} onpointercancel={leave}>
				<!-- A 6px dot is a pinpoint; this is what the pointer actually has to
				     find. First child, so the name paints over it and stays selectable. -->
				<circle cx={point.cx} cy={point.cy} r={HIT / 2} fill="transparent" />

				<circle
					cx={point.cx}
					cy={point.cy}
					r={active === i ? DOT + 2 : DOT}
					fill={theme.from}
					fill-opacity={px(opacity(point.row.count ?? 0))}
					stroke={active === i ? theme.ink : theme.background}
				/>

				<!-- A leader only when the name had to move off its own point. -->
				{#if Math.abs(point.labelY - point.cy) > 2}
					<line
						x1={point.cx + side * (DOT + 3)}
						x2={point.cx + side * (GUTTER - 2)}
						y1={point.cy}
						y2={point.labelY}
						stroke={theme.rule}
						vector-effect="non-scaling-stroke"
					/>
				{/if}

				<text
					x={point.cx + side * GUTTER}
					y={middle(point.labelY, TICK_SIZE)}
					text-anchor={point.flip ? 'end' : 'start'}
					font-size={TICK_SIZE}
					fill={theme.ink}
				>
					{clip(short(point.row.response), chars(point.room, TICK_SIZE))}
				</text>
			</g>
		{/each}
	</g>

	<!-- Density key: the same hue from its weakest to its strongest. -->
	<g transform="translate({width - RAMP_WIDTH + 16}, {PAD})">
		<defs>
			<linearGradient id="density-{uid}" x1="0" x2="0" y1="1" y2="0">
				<stop offset="0%" stop-color={theme.from} stop-opacity="0.3" />
				<stop offset="100%" stop-color={theme.from} stop-opacity="1" />
			</linearGradient>
		</defs>

		<text y="-8" font-size={TICK_SIZE} font-weight="600" fill={theme.ink}>Responses</text>
		<rect width="14" height={rampHeight} rx="7" fill="url(#density-{uid})" />
		<text x="20" y="8" font-size={TICK_SIZE} fill={theme.muted}>{count(Math.max(...frequencies))}</text>
		<text x="20" y={rampHeight - 2} font-size={TICK_SIZE} fill={theme.muted}>{count(Math.min(...frequencies))}</text>
	</g>
</Frame>
