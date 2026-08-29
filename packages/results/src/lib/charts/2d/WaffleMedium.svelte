<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { grid, oneIn, readingOf, rowsOf, shareOf } from '$charts/utils/expressive'
	import { GAP, px, theme } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const rows = $derived(rowsOf(figure))
	const row = $derived(rows[0])
	const share = $derived(shareOf(figure))

	const cells = $derived(oneIn(share))
	const slots = $derived(Array.from({ length: cells }, (_, i) => i))
	const layout = $derived(grid(cells, Math.min(width, 620), GAP))

	const origin = $derived(px((width - (layout.columns * layout.size + GAP * (layout.columns - 1))) / 2))

	const height = $derived(layout.height)

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: `1 in ${cells}`, color: theme.focus }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	<g transform="translate({origin} 0)">
		{#each slots as i (i)}
			{@const column = i % layout.columns}
			{@const line = Math.floor(i / layout.columns)}

			<rect
				x={px(column * (layout.size + GAP))}
				y={px(line * (layout.size + GAP))}
				width={layout.size}
				height={layout.size}
				fill={i === 0 ? theme.focus : theme.rest}
				role="presentation"
				onpointermove={enter}
				onpointerleave={() => onhover?.(null)}
			/>
		{/each}
	</g>
</Frame>
