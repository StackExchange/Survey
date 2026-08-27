<script lang="ts">
	// "1 in X" as cubes, in two rows climbing away to the right.
	import { cube, CUBE, cubeHeight, oneIn, readingOf, rowsOf, shareOf } from '$charts/utils/expressive'
	import { OFF, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const rows = $derived(rowsOf(figure))
	const row = $derived(rows[0])
	const share = $derived(shareOf(figure))
	const cells = $derived(oneIn(share))

	// Capped, or "1 in 2" draws two cubes half a page wide each.
	const size = $derived(Math.min(width / cells, width / 5))
	const half = $derived(cubeHeight(size) / 2)

	const placed = $derived(
		Array.from({ length: cells }, (_, i) => {
			const pair = Math.floor(i / 2)
			const lower = i % 2

			// The lower of a pair is one column on and one level down — the field's own
			// step, so the two rows stagger instead of butting together.
			return { i, column: 2 * pair + lower, level: lower - 2 * pair }
		})
	)

	const ceiling = $derived(Math.min(...placed.map((cell) => cell.level)))
	const floor = $derived(Math.max(...placed.map((cell) => cell.level)))
	const height = $derived((floor - ceiling) * half + cubeHeight(size))
	const left = $derived((width - cells * size) / 2)

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: `1 in ${cells}`, color: theme.focus }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each placed as cell (cell.i)}
		{@const on = cell.i === 0}

		<g
			transform={cube(left + cell.column * size, (cell.level - ceiling) * half, size)}
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
