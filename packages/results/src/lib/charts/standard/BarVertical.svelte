<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { scaleLinear } from 'd3-scale'

	import { useDomain, useFocus } from '$charts/utils/chrome'
	import { amountOf, formatOf, rowsOf, valueOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import {
		chars,
		clip,
		count,
		describeTooltip,
		digitsWidth,
		GAP,
		hanging,
		HOVER_WASH,
		LABEL,
		middle,
		PAD,
		px,
		series,
		shorten,
		SMALL,
		textWidth,
		theme,
	} from '$charts/utils/theme'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const TICKS = 5
	const LABEL_GAP = 15
	const TITLE_GAP = GAP * 2
	const COLUMN_GAP = 2

	const dim = useFocus()
	const domain = useDomain()
	const hover = useHover(() => onhover)

	// `Number('')` and `Number(null)` are both 0, so an empty response would pass
	// for a numeric one and sort itself to the front of the axis.
	const numeric = (response: unknown) =>
		(typeof response === 'number' || (typeof response === 'string' && response.trim() !== '')) && Number.isFinite(Number(response))

	const rows = $derived.by(() => {
		const given = rowsOf(figure)
		if (given.length < 2 || !given.every((row: any) => numeric(row.response))) return given
		return [...given].sort((a: any, b: any) => Number(a.response) - Number(b.response))
	})

	const short = $derived(shorten(figure))
	const value = $derived(valueOf(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const axisLabels = $derived(figure.axisLabels ?? [])

	const scale = $derived(value ? Math.max(1, ...rows.map(amount)) : domain(rows.map(amount)))

	const tick = (measure: number) => (value ? `${value.unit ?? ''}${count(measure)}` : `${Math.round(measure * 100)}%`)

	const y = $derived(scaleLinear().domain([0, scale]).nice(TICKS).range([1, 0]))
	const yTicks = $derived(scaleLinear().domain([0, scale]).nice(TICKS).ticks(TICKS))

	const TICK_FLOOR = digitsWidth('100%', SMALL)
	const AXIS_LEFT = $derived(PAD + Math.max(TICK_FLOOR, ...yTicks.map((measure) => digitsWidth(tick(measure), SMALL))) + LABEL_GAP)
	const AXIS_BOTTOM = $derived(LABEL_GAP + SMALL + (axisLabels[0] ? TITLE_GAP + SMALL : 0) + PAD)

	const plotWidth = $derived(Math.max(1, width - AXIS_LEFT - PAD))
	const plotHeight = $derived(Math.round(plotWidth * 0.45))
	const height = $derived(PAD + plotHeight + AXIS_BOTTOM)

	const column = $derived(plotWidth / Math.max(1, rows.length))
	const bar = $derived(Math.max(1, column - COLUMN_GAP))

	const up = (measure: number) => plotHeight * (1 - y(measure))

	const widest = $derived(Math.max(0, ...rows.map((row: any) => textWidth(short(row.response), SMALL))))
	const every = $derived(Math.max(1, Math.ceil((widest + GAP) / Math.max(column, 1))))
	const values = $derived(Math.max(0, ...rows.map((row: any) => digitsWidth(format(row), SMALL))) + COLUMN_GAP <= column)

	const yGrid = $derived(yTicks.map((measure) => plotHeight - up(measure)))

	const describe = (row: any) => ({
		title: String(row.response ?? ''),
		rows: [
			{ value: format(row), label: value?.label ?? 'of respondents', color: series(0) },
			...(row.count ? [{ value: count(row.count), label: 'respondents' }] : []),
		],
	})
</script>

<Frame {figure} {width} {height}>
	<g transform="translate({AXIS_LEFT}, {PAD})">
		<Gridlines from={0} to={plotWidth} top={0} bottom={plotHeight} axis="y" at={yGrid} />

		{#each yTicks as measure (measure)}
			<text x={-LABEL_GAP} y={middle(px(plotHeight - up(measure)), SMALL)} text-anchor="end" font-size={SMALL} fill={theme.muted}>
				{tick(measure)}
			</text>
		{/each}

		{#each rows as row, i (row.response ?? i)}
			{@const left = px(i * column)}
			{@const centre = px(i * column + column / 2)}
			{@const drawn = amount(row) ? Math.max(1, px(up(amount(row)))) : 0}
			{@const data = describe(row)}

			<!-- Focusable so a keyboard-only user can reach the tooltip a pointer gets; `role="img"` isn't a widget role, so the linter can't tell this is deliberate. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<g
				opacity={dim(row.response)}
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
				<rect x={left} y="0" width={px(column)} height={plotHeight} fill="transparent" />

				{#if hover.active === i}
					<rect x={left} y="0" width={px(column)} height={plotHeight} fill={theme.ink} opacity={HOVER_WASH} />
				{/if}

				<rect x={px(i * column + (column - bar) / 2)} y={px(plotHeight - drawn)} width={px(bar)} height={drawn} fill={series(0)} />

				{#if values}
					<text
						x={centre}
						y={middle(plotHeight - drawn - LABEL_GAP, LABEL)}
						text-anchor="middle"
						font-size={LABEL}
						font-family={theme.fontHeadline}
						font-weight="600"
						fill={theme.ink}
					>
						{format(row)}
					</text>
				{/if}

				{#if i % every === 0}
					<text x={centre} y={hanging(plotHeight + LABEL_GAP, SMALL)} text-anchor="middle" font-size={SMALL} fill={theme.muted}>
						{clip(short(row.response), chars(column * every, SMALL))}
					</text>
				{/if}
			</g>
		{/each}

		{#if axisLabels[0]}
			<text
				x={plotWidth / 2}
				y={hanging(plotHeight + LABEL_GAP + SMALL + TITLE_GAP, SMALL)}
				text-anchor="middle"
				font-size={SMALL}
				font-weight="600"
				fill={theme.muted}
			>
				{clip(String(axisLabels[0]), chars(plotWidth, SMALL))}
			</text>
		{/if}
	</g>
</Frame>
