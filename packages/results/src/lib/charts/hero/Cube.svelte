<script lang="ts">
	// Two values as two cubes on a shared floor. Sides go as the square root, not
	// the cube root: a reader compares the face they can see.
	import Frame from '$charts/svg-components/SvgWrapper.svelte'
	import { amountOf, formatOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { CUBE, cube, cubeHeight } from '$charts/utils/iso'
	import { chars, clip, descent, px, series, shorten, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 15

	const rows = $derived(rowsOf(figure).slice(0, 2))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(Math.max(0.0001, ...rows.map(amount)))

	// The larger cube takes 55% of the width; the smaller follows from its share.
	const box = $derived(px(Math.min(width * 0.55, 520)))
	const side = (row: any) => px(box * Math.sqrt(Math.max(amount(row), 0) / largest))

	const gap = $derived(px(box * 0.12))
	const floor = $derived(px(cubeHeight(box)))
	const height = $derived(floor + LABEL_SIZE * 2.6 + 10 + descent(LABEL_SIZE))

	const enter = (row: any, i: number, event: PointerEvent) =>
		onhover?.({ title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: series(i) }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	<!-- Largest last so a small cube in front of a big one is not painted over. -->
	{#each rows as row, i (row.response ?? i)}
		{@const s = side(row)}
		{@const x = i === 0 ? 0 : px(side(rows[0]) + gap)}

		<g
			transform={cube(x, floor - cubeHeight(s), s)}
			role="presentation"
			onpointermove={(event) => enter(row, i, event)}
			onpointerleave={() => onhover?.(null)}
		>
			<path d={CUBE.top} fill={theme.faceTop} />
			<path d={CUBE.left} fill={series(i === 0 ? 1 : 6)} />
			<path d={CUBE.right} fill={theme.faceSide} />
		</g>

		<text {x} y={px(floor + LABEL_SIZE + 10)} font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>{format(row)}</text>
		<text {x} y={px(floor + LABEL_SIZE * 2.6 + 10)} font-size={LABEL_SIZE} fill={theme.muted}>
			{clip(short(row.response), chars(Math.max(s, 160), LABEL_SIZE))}
		</text>
	{/each}
</Frame>
