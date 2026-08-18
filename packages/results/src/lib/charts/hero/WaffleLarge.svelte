<script lang="ts">
	// A share as a field of cubes. 10 x 10 in grid space but laid out diagonally —
	// each row steps half a cube right and a quarter down, which is what makes it
	// read as a plane rather than a table.
	import Frame from '$charts/svg/Wrap.svelte'
	import { amountOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { CUBE, SKEW, cube, cubeHeight } from '$charts/utils/iso'
	import { percent, series, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const COLUMNS = 10
	const ROWS = 10

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(amountOf(figure)(row))
	const filled = $derived(share > 0 ? Math.max(1, Math.round(share * 100)) : 0)

	// Footprint plus every row's half-step, or the field runs off the right edge.
	const size = $derived(width / (COLUMNS + ROWS / 2) / 1.15)
	const step = $derived(size * 1.15)

	// The last row's own offset, not one more: the extra reserved empty space.
	const height = $derived((ROWS - 1) * step * SKEW * 0.5 + cubeHeight(size))

	// Painted back to front, so a cube overlaps the one behind it.
	const order = $derived(
		Array.from({ length: COLUMNS * ROWS }, (_, i) => ({ i, column: i % COLUMNS, line: Math.floor(i / COLUMNS) })).sort(
			(a, b) => a.line + a.column - (b.line + b.column)
		)
	)

	const at = (column: number, line: number) => ({
		x: column * step + line * step * 0.5,
		y: line * step * SKEW * 0.5,
	})

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: percent(share), label: 'of respondents', color: series(3) }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each order as cell (cell.i)}
		{@const point = at(cell.column, cell.line)}
		{@const on = cell.i < filled}

		<g transform={cube(point.x, point.y, size)} role="presentation" onpointermove={enter} onpointerleave={() => onhover?.(null)}>
			<path d={CUBE.top} fill={on ? theme.faceTop : theme.ghost} />
			<path d={CUBE.left} fill={on ? series(3) : theme.tint} />
			<path d={CUBE.right} fill={on ? theme.faceSide : theme.ghost} />
		</g>
	{/each}
</Frame>
