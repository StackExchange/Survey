<script lang="ts">
	// "1 in X" as cubes: the large waffle's slab, two deep, with the long axis
	// negated so it climbs away to the right where that one descends.
	import type { OnHover } from '$charts/utils/theme'

	import { cube, CUBE, cubeHeight, oneIn, readingOf, rowsOf, shareOf } from '$charts/utils/expressive'
	import { OFF, theme } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	const SHORT = 2

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(shareOf(figure))
	const cells = $derived(oneIn(share))

	const long = $derived(Math.ceil(cells / SHORT))

	const placed = $derived(
		Array.from({ length: long * SHORT }, (_, i) => {
			const a = i % long
			const b = Math.floor(i / long)

			return { column: a + b, level: long - 1 - a + b }
		})
			.sort((p, q) => p.column - q.column || p.level - q.level)
			.slice(0, cells)
			.map((cell, i) => ({ ...cell, i }))
	)

	const span = $derived(placed[placed.length - 1].column + 1)

	// Capped, or "1 in 2" draws two cubes half a page wide each.
	const size = $derived(Math.min(width / span, width / 5))
	const half = $derived(cubeHeight(size) / 2)

	const height = $derived(long * half + cubeHeight(size))
	const left = $derived((width - span * size) / 2)

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: `1 in ${cells}`, color: theme.focus }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each placed as cell (cell.i)}
		{@const on = cell.i === 0}

		<g
			transform={cube(left + cell.column * size, cell.level * half, size)}
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
