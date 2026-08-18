<script lang="ts">
	// A column per response with a flat accent cap. The cap is a constant height:
	// it echoes the isometric top face, it is not a second measurement.
	import { scaleLinear } from 'd3-scale'

	import Frame from '$charts/svg/Wrap.svelte'
	import { amountOf, formatOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { chars, clip, descent, px, series, shorten, theme } from '$charts/utils/theme'
	import { HIT, type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const CAP = 34
	const GAP = 14
	const LABEL_SIZE = 12

	let active = $state<number | null>(null)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(Math.max(0.0001, ...rows.map(amount)))
	const leader = $derived(rows.findIndex((row: any) => amount(row) === largest))

	const plot = $derived(px(Math.min(width * 0.55, 420)))
	const height = $derived(plot + CAP + LABEL_SIZE * 2.2 + 6 + descent(LABEL_SIZE))

	const column = $derived(px((width - GAP * Math.max(rows.length - 1, 0)) / Math.max(rows.length, 1)))
	const y = $derived(scaleLinear().domain([0, largest]).range([0, plot]).clamp(true))

	const enter = (i: number, row: any, event: PointerEvent) => {
		active = i
		onhover?.({ title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: series(0) }] }, event)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	{#each rows as row, i (row.response ?? i)}
		{@const x = px(i * (column + GAP))}
		{@const body = px(y(amount(row)))}
		<!-- Baseline is plot + CAP, so the tallest column's cap starts at 0. -->
		{@const top = px(plot - body)}

		<rect {x} y={top} width={column} height={CAP} fill={theme.faceTop} />
		<rect {x} y={px(top + CAP)} width={column} height={body} fill={i === leader ? series(0) : theme.faceSide} />

		<text
			x={px(x + column / 2)}
			y={px(plot + CAP + LABEL_SIZE + 6)}
			text-anchor="middle"
			font-size={LABEL_SIZE}
			font-weight="600"
			fill={theme.ink}
		>
			{format(row)}
		</text>
		<text x={px(x + column / 2)} y={px(plot + CAP + LABEL_SIZE * 2.2 + 6)} text-anchor="middle" font-size={LABEL_SIZE} fill={theme.muted}>
			{clip(short(row.response), chars(column, LABEL_SIZE))}
		</text>

		<!-- The whole column band, so a short bar is still reachable. -->
		<rect
			{x}
			y="0"
			width={Math.max(column, HIT)}
			height={px(plot + CAP)}
			fill={active === i ? theme.ink : 'transparent'}
			opacity={active === i ? 0.05 : 1}
			role="presentation"
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={leave}
			onpointercancel={leave}
		/>
	{/each}
</Frame>
