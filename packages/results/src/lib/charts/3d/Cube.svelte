<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { amountOf, CUBE, cube, cubeHeight, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { chars, clip, descent, LABEL, LABEL_DY, px, shorten, theme, VALUE } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const VALUE_GAP = 16

	const rows = $derived(rowsOf(figure).slice(0, 2))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))

	// A cube's projected width is its side exactly, and the gap is a share of
	// `box`, so the row's whole demand is `box * spread`.
	const ratio = (row: any) => Math.sqrt(Math.max(amount(row), 0) / largest)
	const spread = $derived(rows.reduce((sum: number, row: any) => sum + ratio(row), 0) + (rows.length - 1) * 0.12)
	const box = $derived(px(Math.min(width * 0.55, 520, width / Math.max(spread, 1))))

	const side = (row: any) => px(box * ratio(row))
	const gap = $derived(px(box * 0.12))
	const first = $derived(px((width - box * spread) / 2))
	const floor = $derived(px(cubeHeight(box)))

	const valueY = $derived(px(floor + VALUE_GAP + VALUE))
	const labelY = $derived(px(valueY + LABEL_DY))
	const height = $derived(labelY + descent(LABEL))

	const enter = (row: any, event: PointerEvent) =>
		onhover?.({ title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: theme.focus }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each rows as row, i (row.response ?? i)}
		{@const s = side(row)}
		{@const x = i === 0 ? first : px(first + side(rows[0]) + gap)}

		<g
			transform={cube(x, floor - cubeHeight(s), s)}
			role="presentation"
			onpointermove={(event) => enter(row, event)}
			onpointerleave={() => onhover?.(null)}
		>
			<path d={CUBE.top} fill={theme.accent} />
			<path d={CUBE.left} fill={theme.focus} />
			<path d={CUBE.right} fill={theme.rest} />
		</g>

		<text {x} y={valueY} font-size={VALUE} font-family={theme.fontHeadline} font-weight="600" fill={theme.ink}>{format(row)}</text>
		<text {x} y={labelY} font-size={LABEL} fill={theme.muted}>
			{clip(short(row.response), chars(Math.min(Math.max(s, 160), width - x), LABEL))}
		</text>
	{/each}
</Frame>
