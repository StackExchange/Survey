<script lang="ts">
	// The "1 in X" shape as cubes, butted end to end, every other column dropping half
	// a cube height so the two interlock. Two rows once there are more than five, so
	// the field stays wider than it is deep.
	import { cube, CUBE, cubeHeight, oneIn, readingOf, rowsOf, shareOf } from '$charts/utils/expressive'
	import { OFF, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const rows = $derived(rowsOf(figure))
	const row = $derived(rows[0])
	const share = $derived(shareOf(figure))
	const cells = $derived(oneIn(share))

	const lines = $derived(cells > 5 ? 2 : 1)
	const columns = $derived(Math.ceil(cells / lines))

	// Capped, or "1 in 2" draws two cubes half a page wide each.
	const size = $derived(Math.min(width / columns, width / 5))
	const lineHeight = $derived(cubeHeight(size))
	const stagger = $derived(lineHeight / 2)

	// The staggered columns hang half a cube below the last full row.
	const height = $derived(lines * lineHeight + stagger)

	// Index order: nothing overlaps on a grid this tight, so there is no back to
	// front to paint in.
	const order = $derived(Array.from({ length: cells }, (_, i) => ({ i, column: i % columns, line: Math.floor(i / columns) })))

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: `1 in ${cells}`, color: theme.focus }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each order as cell (cell.i)}
		{@const on = cell.i === 0}

		<g
			transform={cube(cell.column * size, cell.line * lineHeight + (cell.column % 2) * stagger, size)}
			opacity={on ? 1 : OFF}
			role="presentation"
			onpointermove={enter}
			onpointerleave={() => onhover?.(null)}
		>
			<path d={CUBE.top} fill={on ? theme.accent : theme.offTop} />
			<path d={CUBE.left} fill={on ? theme.focus : theme.offLeft} />
			<path d={CUBE.right} fill={on ? theme.rest : theme.offRight} />
		</g>
	{/each}
</Frame>
