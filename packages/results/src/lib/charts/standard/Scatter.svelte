<script lang="ts">
	// Density is opacity on one hue, not an interpolated ramp: the palette is
	// `var()` tokens and d3 can only interpolate literal colours.
	import type { OnHover } from '$charts/utils/theme'

	import { scaleLinear } from 'd3-scale'

	import { useFocus } from '$charts/utils/chrome'
	import { rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import {
		chars,
		clip,
		count,
		descent,
		describeTooltip,
		digitsWidth,
		FINE,
		GAP,
		hanging,
		HIT,
		middle,
		PAD,
		px,
		shorten,
		SMALL,
		textWidth,
		theme,
	} from '$charts/utils/theme'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const uid = $props.id()

	const hover = useHover(() => onhover)
	const dim = useFocus()

	const TICKS = 6
	const DOT = 10
	const TICK_GAP = GAP * 2
	const TITLE_GAP = GAP * 2
	const RAMP_BAR = 14

	const rows = $derived(rowsOf(figure))
	const axes = $derived.by(() => {
		if (!figure.axes) return null
		const [x, y] = figure.axisLabels ?? []
		return {
			x: { ...figure.axes.x, label: x || figure.axes.x?.label },
			y: { ...figure.axes.y, label: y || figure.axes.y?.label },
		}
	})
	const short = $derived(shorten(figure))

	const valueAt = (row: any, axis: any) => (axis ? (row?.[axis.key] ?? 0) : 0)

	const span = (values: number[]) => {
		const min = Math.min(...values)
		const max = Math.max(...values)

		return min === max ? [min - 1, max + 1] : [min, max]
	}

	// '$' reads before the number, '%' after it — prefixing both gives "%10".
	const tick = (value: number, axis: any) => {
		if (axis?.unit === '$') return `$${count(value)}`

		return `${value}${axis?.unit === '%' ? '%' : ''}`
	}

	const frequencies = $derived(rows.map((row: any) => row.count ?? 0))

	const FAINTEST = 0.3
	const opacity = $derived(scaleLinear().domain(span(frequencies)).range([FAINTEST, 1]).clamp(true))

	const domain = (axis: any) => span(rows.map((row: any) => valueAt(row, axis)))
	const xTicks = $derived(scaleLinear().domain(domain(axes?.x)).nice().ticks(TICKS))
	const yTicks = $derived(scaleLinear().domain(domain(axes?.y)).nice().ticks(TICKS))

	const roomFor = (labels: string[]) => Math.max(...labels.map((text) => digitsWidth(text, SMALL)))

	const AXIS_LEFT = $derived(PAD + SMALL + TITLE_GAP + roomFor(yTicks.map((value) => tick(value, axes?.y))) + TICK_GAP)
	const AXIS_BOTTOM = PAD + SMALL + TITLE_GAP + SMALL + TICK_GAP
	const RAMP_WIDTH = $derived(RAMP_BAR + GAP + roomFor(frequencies.map((value) => count(value))) + PAD)

	const plotWidth = $derived(Math.max(1, width - AXIS_LEFT - RAMP_WIDTH - PAD))
	const plotHeight = $derived(Math.round(plotWidth * 0.75))
	const height = $derived(PAD + plotHeight + AXIS_BOTTOM)
	const rampHeight = $derived(Math.round(plotHeight * 0.4))

	const xScale = $derived(scaleLinear().domain(domain(axes?.x)).range([0, plotWidth]).nice())
	const yScale = $derived(scaleLinear().domain(domain(axes?.y)).range([plotHeight, 0]).nice())
	const xGrid = $derived(xTicks.slice(0, -1).map((value) => xScale(value)))
	const yGrid = $derived(yTicks.slice(0, -1).map((value) => yScale(value)))

	const GUTTER = DOT / 2 + GAP
	const LINE = FINE + 2
	const NAME = 32

	// Handle label conflicts
	const points = $derived.by(() => {
		const placed = rows
			.map((row: any) => ({
				row,
				cx: px(xScale(valueAt(row, axes?.x))),
				cy: px(yScale(valueAt(row, axes?.y))),
			}))
			.sort((a: any, b: any) => a.cy - b.cy)

		const taken: any[] = []

		const slotFor = (point: any, flip: boolean, y: number) => {
			const room = (flip ? point.cx : plotWidth - point.cx) - GUTTER
			const text = clip(clip(short(point.row.response), NAME), chars(room, FINE))
			const width = textWidth(text, FINE)
			const x0 = flip ? point.cx - GUTTER - width : point.cx + GUTTER

			// Two names clash only where they share both a line and a stretch of it.
			const clear =
				room >= FINE &&
				y >= 0 &&
				y <= plotHeight &&
				!taken.some((other: any) => other.x0 < x0 + width && x0 < other.x1 && Math.abs(other.y - y) < LINE)

			return { flip, text, y, x0, x1: x0 + width, clear }
		}

		for (const point of placed) {
			// The roomier side first, so a name by an edge starts on the inside.
			const near = point.cx > plotWidth / 2
			let slot = slotFor(point, near, point.cy)

			for (let step = 0; step < 4 && !slot.clear; step++)
				for (const flip of [near, !near]) {
					slot = slotFor(point, flip, point.cy + step * LINE)
					if (slot.clear) break
				}

			// Nothing free within reach: back to the point. An overlap there reads
			// better than a name a long way from its mark.
			if (!slot.clear) slot = slotFor(point, near, point.cy)

			Object.assign(point, slot, { labelY: slot.y })
			taken.push(slot)
		}

		return placed
	})

	const describe = (row: any) => ({
		title: String(row.response ?? ''),
		rows: [
			{ value: tick(valueAt(row, axes?.y), axes?.y), label: axes?.y?.label, color: theme.accent },
			{ value: tick(valueAt(row, axes?.x), axes?.x), label: axes?.x?.label },
			{ value: count(row.count), label: 'respondents' },
		],
	})
</script>

<Frame {figure} {width} {height}>
	<g transform="translate({AXIS_LEFT}, {PAD})">
		<Gridlines from={0} to={plotWidth} top={0} bottom={plotHeight} at={xGrid} />
		<Gridlines from={0} to={plotWidth} top={0} bottom={plotHeight} axis="y" at={yGrid} />

		{#each xTicks as value (value)}
			<text x={px(xScale(value))} y={hanging(plotHeight + TICK_GAP, SMALL)} text-anchor="middle" font-size={SMALL} fill={theme.muted}>
				{tick(value, axes?.x)}
			</text>
		{/each}

		{#each yTicks as value (value)}
			<text x={-TICK_GAP} y={middle(px(yScale(value)), SMALL)} text-anchor="end" font-size={SMALL} fill={theme.muted}>
				{tick(value, axes?.y)}
			</text>
		{/each}

		{#if axes?.x?.label}
			<text
				x={plotWidth / 2}
				y={hanging(plotHeight + TICK_GAP + SMALL + TITLE_GAP, SMALL)}
				text-anchor="middle"
				font-size={SMALL}
				font-weight="600"
				fill={theme.muted}
			>
				{clip(String(axes.x.label), chars(plotWidth, SMALL))}
			</text>
		{/if}
		{#if axes?.y?.label}
			<text
				text-anchor="middle"
				font-size={SMALL}
				font-weight="600"
				fill={theme.muted}
				transform="translate({px(hanging(PAD, SMALL) - AXIS_LEFT)}, {plotHeight / 2}) rotate(-90)"
			>
				{clip(String(axes.y.label), chars(plotHeight, SMALL))}
			</text>
		{/if}

		{#each points as point, i (point.row.response ?? i)}
			{@const side = point.flip ? -1 : 1}
			{@const size = hover.active === i ? DOT + 2 : DOT}
			{@const data = describe(point.row)}

			<!-- Focusable so a keyboard-only user can reach the tooltip a pointer gets; `role="img"` isn't a widget role, so the linter can't tell this is deliberate. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<g
				opacity={dim(point.row.response)}
				role="img"
				aria-label={describeTooltip(data)}
				tabindex="0"
				onpointerdown={(event) => hover.enter(i, data, event)}
				onpointermove={(event) => hover.enter(i, data, event)}
				onpointerleave={hover.leave}
				onpointercancel={hover.leave}
				onfocus={(event) => hover.enter(i, data, event)}
				onblur={hover.leave}
			>
				<rect x={point.cx - HIT / 2} y={point.cy - HIT / 2} width={HIT} height={HIT} fill="transparent" />

				<rect
					x={point.cx - size / 2}
					y={point.cy - size / 2}
					width={size}
					height={size}
					fill={theme.accent}
					fill-opacity={px(opacity(point.row.count ?? 0))}
					stroke-width={hover.active === i ? 2 : 0}
					stroke={hover.active === i ? theme.ink : theme.background}
				/>

				<!-- Line connecting the text and the square -->
				{#if Math.abs(point.labelY - point.cy) > 2}
					<line
						x1={point.cx + side * (DOT + 3)}
						x2={point.cx + side * (GUTTER - 2)}
						y1={point.cy}
						y2={point.labelY}
						stroke={theme.ink}
						vector-effect="non-scaling-stroke"
					/>
				{/if}

				<text
					x={point.cx + side * GUTTER}
					y={middle(point.labelY, FINE)}
					text-anchor={point.flip ? 'end' : 'start'}
					font-size={FINE}
					font-weight={hover.active === i ? 'bold' : 'normal'}
					fill={theme.ink}
				>
					{point.text}
				</text>
			</g>
		{/each}
	</g>

	<g transform="translate({px(width - RAMP_WIDTH)}, {PAD})">
		<defs>
			<linearGradient id="density-{uid}" x1="0" x2="0" y1="1" y2="0">
				<stop offset="0%" stop-color={theme.accent} stop-opacity={FAINTEST} />
				<stop offset="100%" stop-color={theme.accent} stop-opacity="1" />
			</linearGradient>
		</defs>

		<rect width={RAMP_BAR} height={rampHeight} rx={RAMP_BAR / 2} fill="url(#density-{uid})" />

		<!-- The two ends of the bar, read against its top and bottom edges. -->
		<text x={RAMP_BAR + GAP} y={hanging(0, FINE)} font-size={FINE} fill={theme.muted}>{count(Math.max(...frequencies))}</text>
		<text x={RAMP_BAR + GAP} y={rampHeight - descent(FINE)} font-size={FINE} fill={theme.muted}>{count(Math.min(...frequencies))}</text>

		<!-- Turned into the column the numbers leave empty between them, so titling
		     the ramp costs no width. -->
		<text
			text-anchor="middle"
			font-size={SMALL}
			font-weight="600"
			fill={theme.muted}
			transform="translate({hanging(RAMP_BAR + GAP, SMALL)}, {px(rampHeight / 2)}) rotate(-90)"
		>
			{clip('Responses', chars(rampHeight, SMALL))}
		</text>
	</g>
</Frame>
