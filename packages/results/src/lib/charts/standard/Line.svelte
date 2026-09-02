<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { scaleLinear, scalePoint } from 'd3-scale'
	import { line as lineShape } from 'd3-shape'

	import { useLimit } from '$charts/utils/chrome'
	import { largestOf, LINE_SERIES_DEFAULT, rankedSeriesOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { digitsWidth, hanging, HOVER_WASH, legend, middle, PAD, percent, px, series, shorten, SMALL, theme } from '$charts/utils/theme'
	import { bySeries } from '$lib/table'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Legend from '$charts/svg/Legend.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const hover = useHover(() => onhover)
	const short = $derived(shorten(figure))
	const limit = useLimit()

	const TICKS = 5
	const LABEL_GAP = 15
	const DOT = 4
	const STROKE = 2

	// Rows already run oldest to newest but sorted again here for a response that isn't a year
	const chronological = (rows: any[]) => {
		if (rows.length < 2 || !rows.every((row) => Number.isFinite(Number(row.response)))) return rows
		return [...rows].sort((a, b) => Number(a.response) - Number(b.response))
	}

	// Ranked by their most recent value; capped so colors — the palette
	// repeats past `LINE_SERIES_DEFAULT` — don't collide, unless a caller
	// (the question page's customize panel) has already picked a set.
	const allNames = $derived(rankedSeriesOf(figure))
	const names = $derived(allNames.slice(0, limit() ?? LINE_SERIES_DEFAULT))
	const note = $derived(allNames.length > names.length ? `Top ${names.length} shown` : undefined)

	const rows = $derived(chronological(bySeries(figure.data, names)))

	const key = $derived(
		legend(
			names.map((name: string) => short(name)),
			Math.max(1, width - PAD * 2)
		)
	)

	const yMax = $derived(largestOf(names.flatMap((_: string, s: number) => rows.map((row: any) => row.cells[s]?.pct ?? 0))))

	// `ticks()` only reads the domain, so the gutter it sizes can be found
	// before the plot height — which the gutter itself determines — exists.
	const yTicks = $derived(scaleLinear().domain([0, yMax]).nice(TICKS).ticks(TICKS))

	const TICK_FLOOR = digitsWidth('100%', SMALL)
	const AXIS_LEFT = $derived(PAD + Math.max(TICK_FLOOR, ...yTicks.map((measure) => digitsWidth(percent(measure), SMALL))) + LABEL_GAP)
	const AXIS_BOTTOM = LABEL_GAP + SMALL + PAD

	const plotWidth = $derived(Math.max(1, width - AXIS_LEFT - PAD))
	const plotHeight = $derived(Math.round(plotWidth * 0.45))
	const height = $derived(PAD + key.height + plotHeight + AXIS_BOTTOM)

	const yScale = $derived(scaleLinear().domain([0, yMax]).nice(TICKS).range([plotHeight, 0]))

	const x = $derived(
		scalePoint()
			.domain(rows.map((row: any) => row.response))
			.range([0, plotWidth])
			.padding(0.5)
	)
	const step = $derived(x.step() ?? 0)
	const posX = (row: any) => x(row.response) ?? 0

	// A cell's `null` where a series has no row that year `defined` breaks the line there rather than drawing a false 0.
	const path = $derived(
		lineShape<{ row: any; value: number | null }>()
			.defined((d) => d.value != null)
			.x((d) => px(posX(d.row)))
			.y((d) => px(yScale(d.value ?? 0)))
	)

	const lines = $derived(
		names.map((_: string, s: number) => path(rows.map((row: any) => ({ row, value: row.cells[s]?.pct ?? null }))) ?? '')
	)

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(
			i,
			{
				title: String(row.response ?? ''),
				rows: names
					.map((name: string, s: number) => ({ name, s, cell: row.cells[s] }))
					.filter((entry: any) => entry.cell)
					.sort((a: any, b: any) => (b.cell.pct ?? 0) - (a.cell.pct ?? 0))
					.map((entry: any) => ({ value: percent(entry.cell.pct ?? 0), label: short(entry.name), color: series(entry.s) })),
			},
			event
		)
	}
</script>

<Frame {figure} {width} {height} {note}>
	<g transform="translate({PAD}, {PAD})">
		<Legend layout={key} colors={names.map((_: string, i: number) => series(i))} />
	</g>

	<g transform="translate({AXIS_LEFT}, {PAD + key.height})">
		<Gridlines from={0} to={plotWidth} top={0} bottom={plotHeight} axis="y" at={yTicks.map((measure) => yScale(measure))} />

		{#each yTicks as measure (measure)}
			<text x={-LABEL_GAP} y={middle(px(yScale(measure)), SMALL)} text-anchor="end" font-size={SMALL} fill={theme.muted}>
				{percent(measure)}
			</text>
		{/each}

		{#each rows as row, i (row.response ?? i)}
			{@const cx = posX(row)}
			<g
				role="presentation"
				onpointerdown={(event) => enter(i, row, event)}
				onpointermove={(event) => enter(i, row, event)}
				onpointerleave={hover.leave}
				onpointercancel={hover.leave}
			>
				<rect x={px(cx - step / 2)} y="0" width={px(step)} height={plotHeight} fill="transparent" />

				{#if hover.active === i}
					<rect x={px(cx - step / 2)} y="0" width={px(step)} height={plotHeight} fill={theme.ink} opacity={HOVER_WASH} />
				{/if}

				<text x={px(cx)} y={hanging(plotHeight + LABEL_GAP, SMALL)} text-anchor="middle" font-size={SMALL} fill={theme.muted}>
					{short(row.response)}
				</text>
			</g>
		{/each}

		{#each names as name, s (name)}
			<path
				d={lines[s]}
				fill="none"
				stroke={series(s)}
				stroke-width={STROKE}
				stroke-linejoin="round"
				stroke-linecap="round"
				pointer-events="none"
			/>

			{#each rows as row, i (row.response ?? i)}
				{#if row.cells[s]}
					<circle
						cx={px(posX(row))}
						cy={px(yScale(row.cells[s].pct ?? 0))}
						r={hover.active === i ? DOT + 1.5 : DOT}
						fill={series(s)}
						stroke={theme.background}
						stroke-width={hover.active === i ? 2 : 1}
						pointer-events="none"
					/>
				{/if}
			{/each}
		{/each}
	</g>
</Frame>
