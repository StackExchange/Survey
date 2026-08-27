<script lang="ts">
	import { cube, CUBE, cubeHeight, readingOf, rowsOf, shareOf } from '$charts/utils/expressive'
	import { descent, OFF, percent, px, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LONG = 10
	const SHORT = 5
	const CELLS = LONG * SHORT
	const SPAN = LONG + SHORT - 1

	const LABEL_SIZE = 16
	const UNIT_SIZE = 25

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(shareOf(figure))

	const filled = $derived(share > 0 ? Math.max(1, Math.round(share * CELLS)) : 0)

	const size = $derived(width / SPAN)
	const half = $derived(cubeHeight(size) / 2)

	const grid = $derived((SPAN - 1) * half + cubeHeight(size))

	const UNIT_Y = $derived(px((grid * 2) / 3.3 + UNIT_SIZE))
	const NAMED_Y = $derived(px(UNIT_Y + 22))

	const height = $derived(Math.max(grid, NAMED_Y + descent(LABEL_SIZE)))

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
