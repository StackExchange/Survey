<script lang="ts">
	// A numbered list in data order. No bars: the sheet's `limit` has cut this to
	// the top few, where the order is the finding and the gaps usually aren't.
	import Frame from '$charts/svg-components/SvgWrapper.svelte'
	import { formatOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { chars, clip, middle, series, shorten, theme } from '$charts/utils/theme'
	import { HIT, type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const ROW = 66
	const GAP = 10
	const TAB = 36
	const LABEL_SIZE = 30
	const VALUE_SIZE = 15

	let active = $state<number | null>(null)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const format = $derived(formatOf(figure))

	const height = $derived(rows.length * (ROW + GAP))

	// The value sits at the right end, so the label has to stop before it.
	const valueX = $derived(width - 20)
	const labelWidth = $derived(width - TAB - 40 - 90)

	const enter = (i: number, row: any, event: PointerEvent) => {
		active = i
		onhover?.({ title: String(row.response ?? ''), rows: [{ value: format(row), label: `#${i + 1}`, color: series(i) }] }, event)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 10)}>
	{#each rows as row, i (row.response ?? i)}
		{@const y = i * (ROW + GAP)}

		<rect x={TAB} {y} width={Math.max(width - TAB, 0)} height={ROW} fill={active === i ? theme.rule : theme.ghost} />
		<rect x="0" {y} width={TAB} height={ROW} fill={series(i)} />

		<text x={TAB + 24} y={middle(y + ROW / 2, LABEL_SIZE)} font-family={theme.fontHeadline} font-size={LABEL_SIZE} fill={theme.ink}>
			{i + 1}. {clip(short(row.response), chars(labelWidth, LABEL_SIZE))}
		</text>

		<text x={valueX} y={middle(y + ROW / 2, VALUE_SIZE)} text-anchor="end" font-size={VALUE_SIZE} font-weight="600" fill={theme.muted}>
			{format(row)}
		</text>

		<rect
			x="0"
			{y}
			{width}
			height={Math.max(ROW, HIT)}
			fill="transparent"
			role="presentation"
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={leave}
			onpointercancel={leave}
		/>
	{/each}
</Frame>
