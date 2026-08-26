<script lang="ts">
	// A share as a field of cubes: 50 of them, so one cube is two percentage points.
	//
	// The field is a rhombus, 10 cubes along one lattice axis and 5 along the other.
	// Both axes step a full footprint across and half a cube height — one down-right,
	// one up-right — which is what makes the rows increasingly staggered and lands
	// every cube edge to edge with its neighbours rather than overlapping them.
	//
	//   column = a + b            a: 0..LONG-1,  down-right
	//   level  = a - b + SHORT-1  b: 0..SHORT-1, up-right
	import { cube, CUBE, cubeHeight, readingOf, rowsOf, shareOf } from '$charts/utils/expressive'
	import { OFF, percent, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LONG = 10
	const SHORT = 5
	const CELLS = LONG * SHORT

	// The rhombus spans this many columns, and the same many levels — a level being
	// half a cube height, so the two cubes above and below in a column sit a whole
	// one apart.
	const SPAN = LONG + SHORT - 1

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(shareOf(figure))

	// At least one cube for a real-but-tiny share, as `percent` does for "<1%".
	const filled = $derived(share > 0 ? Math.max(1, Math.round(share * CELLS)) : 0)

	const size = $derived(width / SPAN)
	const half = $derived(cubeHeight(size) / 2)
	const height = $derived((SPAN - 1) * half + cubeHeight(size))

	// Column by column, top to bottom within one, so the filled front sweeps left to
	// right from the rhombus's own point.
	const cells = $derived(
		Array.from({ length: CELLS }, (_, i) => {
			const a = i % LONG
			const b = Math.floor(i / LONG)
			return { column: a + b, level: a - b + SHORT - 1 }
		})
			.sort((p, q) => p.column - q.column || p.level - q.level)
			.map((cell, i) => ({ ...cell, i }))
	)

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: percent(share), label: 'of respondents', color: theme.focus }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each cells as cell (cell.i)}
		{@const on = cell.i < filled}

		<g
			transform={cube(cell.column * size, cell.level * half, size)}
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
