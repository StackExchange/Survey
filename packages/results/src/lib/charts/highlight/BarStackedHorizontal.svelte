<script lang="ts">
	// A row per response, centred. Row length is a share of the largest response so
	// the set fills the width — one solid bar per value, nothing stacked inside it.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, middle, onSeries, px, series, shorten, textWidth, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const BAR = 44
	const GAP = 8
	const LABEL_SIZE = 15

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))
	const leader = $derived(rows.findIndex((row: any) => amount(row) === largest))
	const focused = $derived(focusedOf(figure))
	const accent = $derived(focused ?? rows[leader])
	const accentFill = $derived(focused ? theme.focus : series(0))
	const accentInk = $derived(focused ? theme.onFocus : onSeries(0))
	// Pointer first, then the accent: hovering any mark — the focused one included —
	// turns it black, and the accent is what is drawn when the pointer is elsewhere.
	// `ink`/`background` are a pair, so that reads black on a light page and white on
	// a dark one.
	const fillOf = (row: any, hovered: boolean) => (hovered ? theme.ink : row === accent ? accentFill : theme.rest)
	const inkOf = (row: any, hovered: boolean) => (hovered ? theme.background : row === accent ? accentInk : theme.onRest)
	const x = $derived(scaleLinear().domain([0, largest]).range([0, width]).clamp(true))

	// Breathing room at each end of a label, which is also what it is clipped to.
	const INSET = 12
	const height = $derived(rows.length * (BAR + GAP) - GAP)

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: series(0) }] }, event)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	{#each rows as row, i (row.response ?? i)}
		{@const y = px(i * (BAR + GAP))}
		{@const length = px(x(amount(row)))}
		{@const start = px((width - length) / 2)}
		{@const label = clip(short(row.response), chars(width - INSET * 2, LABEL_SIZE))}
		{@const inside = textWidth(label, LABEL_SIZE) + INSET * 2 <= length}

		<g role="presentation" onpointermove={(event) => enter(i, row, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
			<rect x="0" {y} {width} height={Math.max(BAR, HIT)} fill="transparent" />

			<rect x={start} {y} width={length} height={BAR} fill={fillOf(row, hover.active === i)} />

			<text
				x={px(start + (inside ? length / 2 : length + INSET))}
				y={middle(y + BAR / 2, LABEL_SIZE)}
				text-anchor={inside ? 'middle' : 'start'}
				font-size={LABEL_SIZE}
				fill={inside ? inkOf(row, hover.active === i) : theme.muted}
			>
				{label}
			</text>
		</g>
	{/each}
</Frame>
