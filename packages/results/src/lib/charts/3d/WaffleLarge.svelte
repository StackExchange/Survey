<script lang="ts">
	// A share as a field of cubes, 10 x 10, butted end to end. A cube's drawn size is
	// exactly `size` across and `cubeHeight(size)` down, so stepping the grid by those
	// two numbers lands each one on its neighbour's edge with nothing between.
	//
	// Every other column then drops half a cube height, which is what interlocks them:
	// a cube's right face ends exactly where its lower-right neighbour's left face
	// begins. Straight off the base artwork, where the four cubes sit at 0, 92.376 and
	// 184.752 — one cube height apart down a column, half of one between columns.
	import { amountOf, CUBE, cube, cubeHeight, readingOf, rowsOf } from '$charts/utils/expressive'
	import { OFF, percent, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const COLUMNS = 10
	const ROWS = 10

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(amountOf(figure)(row))
	const filled = $derived(share > 0 ? Math.max(1, Math.round(share * 100)) : 0)

	const size = $derived(width / COLUMNS)
	const lineHeight = $derived(cubeHeight(size))
	const stagger = $derived(lineHeight / 2)

	// The staggered columns hang half a cube below the last full row.
	const height = $derived(ROWS * lineHeight + stagger)

	// Index order: nothing overlaps on a grid this tight, so there is no back to
	// front to paint in.
	const cells = $derived(Array.from({ length: COLUMNS * ROWS }, (_, i) => ({ i, column: i % COLUMNS, line: Math.floor(i / COLUMNS) })))

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: percent(share), label: 'of respondents', color: theme.focus }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each cells as cell (cell.i)}
		{@const on = cell.i < filled}

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
