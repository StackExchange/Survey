<script lang="ts">
	// The "1 in X" shape as cubes. Two rows once there are more than five, so the
	// field stays wider than it is deep.
	import { amountOf, oneIn, readingOf, rowsOf } from '$charts/utils/expressive'
	import { CUBE, cube, cubeHeight, SKEW } from '$charts/utils/iso'
	import { series, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(amountOf(figure)(row))
	const cells = $derived(oneIn(share))

	const lines = $derived(cells > 5 ? 2 : 1)
	const columns = $derived(Math.ceil(cells / lines))

	// Capped, or "1 in 2" draws two cubes half a page wide each.
	const size = $derived(Math.min(width / (columns + lines / 2) / 1.35, width / 5))
	const step = $derived(size * 1.35)

	const height = $derived((lines - 1) * step * SKEW * 0.5 + cubeHeight(size))

	// Back to front, so a cube overlaps the one behind it.
	const order = $derived(
		Array.from({ length: cells }, (_, i) => ({ i, column: i % columns, line: Math.floor(i / columns) })).sort(
			(a, b) => a.line + a.column - (b.line + b.column)
		)
	)

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: `1 in ${cells}`, color: series(1) }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each order as cell (cell.i)}
		{@const on = cell.i === 0}

		<g
			transform={cube(cell.column * step + cell.line * step * 0.5, cell.line * step * SKEW * 0.5, size)}
			role="presentation"
			onpointermove={enter}
			onpointerleave={() => onhover?.(null)}
		>
			<path d={CUBE.top} fill={on ? theme.faceTop : theme.ghost} />
			<path d={CUBE.left} fill={on ? series(1) : theme.tint} />
			<path d={CUBE.right} fill={on ? theme.faceSide : theme.ghost} />
		</g>
	{/each}
</Frame>
