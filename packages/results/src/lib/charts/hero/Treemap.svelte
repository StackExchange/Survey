<script lang="ts">
	// Cubes in a row, not the nested rectangles the name suggests: nesting reads as
	// containment and these responses are multi-select. Sides go as the square root
	// of the share, so the visible face is the proportional part.
	import Frame from '$charts/svg/Wrap.svelte'
	import { amountOf, formatOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { CUBE, cube, cubeHeight } from '$charts/utils/iso'
	import { chars, clip, descent, px, series, shorten, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 14

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(Math.max(0.0001, ...rows.map(amount)))
	const sides = $derived(rows.map((row: any) => Math.sqrt(Math.max(amount(row), 0) / largest)))

	// The biggest is 1 by definition, so the scale falls out of the shares.
	const gap = $derived(0.1)
	const unit = $derived(width / (sides.reduce((sum: number, s: number) => sum + s, 0) + gap * Math.max(rows.length - 1, 0)))

	const floor = $derived(px(cubeHeight(unit)))
	const height = $derived(floor + LABEL_SIZE * 2.6 + 10 + descent(LABEL_SIZE))

	// Left edge of each cube, from the widths of the ones before it.
	const offsets = $derived(
		sides.reduce((run: number[], s: number, i: number) => [...run, (run[i - 1] ?? 0) + (i ? sides[i - 1] + gap : 0)], [] as number[])
	)

	const enter = (row: any, i: number, event: PointerEvent) =>
		onhover?.({ title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: series(i) }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	{#each rows as row, i (row.response ?? i)}
		{@const size = sides[i] * unit}
		{@const x = px(offsets[i] * unit)}

		<g
			transform={cube(x, floor - cubeHeight(size), size)}
			role="presentation"
			onpointermove={(event) => enter(row, i, event)}
			onpointerleave={() => onhover?.(null)}
		>
			<path d={CUBE.top} fill={theme.faceTop} />
			<path d={CUBE.left} fill={series(i)} />
			<path d={CUBE.right} fill={theme.faceSide} />
		</g>

		<text {x} y={px(floor + LABEL_SIZE + 10)} font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>{format(row)}</text>
		<text {x} y={px(floor + LABEL_SIZE * 2.6 + 10)} font-size={LABEL_SIZE} fill={theme.muted}>
			{clip(short(row.response), chars(Math.max(size, 90), LABEL_SIZE))}
		</text>
	{/each}
</Frame>
