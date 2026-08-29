<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { cube, CUBE, cubeHeight, readingOf, rowsOf, shareOf } from '$charts/utils/expressive'
	import { descent, LABEL, LABEL_DY, OFF, percent, px, theme, VALUE } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LONG = 10
	const SHORT = 5
	const CELLS = LONG * SHORT
	const SPAN = LONG + SHORT - 1

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(shareOf(figure))

	const filled = $derived(share > 0 ? Math.max(1, Math.round(share * CELLS)) : 0)

	const size = $derived(width / SPAN)
	const half = $derived(cubeHeight(size) / 2)

	const grid = $derived((SPAN - 1) * half + cubeHeight(size))

	const valueY = $derived(px((grid * 2) / 3.3 + VALUE))
	const labelY = $derived(px(valueY + LABEL_DY))

	const height = $derived(Math.max(grid, labelY + descent(LABEL)))

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
