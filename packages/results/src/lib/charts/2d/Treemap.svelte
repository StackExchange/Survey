<script lang="ts">
	import { amountOf, focusedOf, formatOf, readingOf, rowsOf, treemapCells } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, LABEL, LABEL_DY, shorten, theme, VALUE } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const height = $derived(width)
	const cells = $derived(treemapCells(rows, rows.map(amount), width, height))
	const focused = $derived(focusedOf(figure))
	const fillOf = (row: any, hovered: boolean) => (hovered ? theme.ink : !focused || row === focused ? theme.focus : theme.rest)
	const tintOf = (rank: number, hovered: boolean) => (hovered || focused ? 1 : 1 - (0.7 * rank) / Math.max(cells.length - 1, 1))

	const inkOf = (row: any, rank: number, hovered: boolean) =>
		hovered
			? theme.background
			: focused
				? row === focused
					? theme.onFocus
					: theme.onRest
				: tintOf(rank, false) < 0.6
					? theme.ink
					: theme.onFocus

	const enter = (cell: any, rank: number, event: PointerEvent) =>
		hover.enter(
			rank,
			{
				title: String(cell.row.response ?? ''),
				rows: [{ value: format(cell.row), label: 'of respondents', color: fillOf(cell.row, false) }],
			},
			event
		)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	{#each cells as cell, rank (cell.i)}
		{@const hovered = hover.active === rank}

		<g role="presentation" onpointermove={(event) => enter(cell, rank, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
			<rect
				x={cell.x}
				y={cell.y}
				width={cell.width}
				height={cell.height}
				fill={fillOf(cell.row, hovered)}
				fill-opacity={tintOf(rank, hovered)}
			/>

			{#if cell.height > LABEL * 3 && cell.width > 70}
				<text x={cell.x + 10} y={cell.y + cell.height - LABEL} font-size={LABEL} fill={inkOf(cell.row, rank, hovered)}>
					{clip(short(cell.row.response), chars(cell.width - 20, LABEL))}
				</text>
				<text
					x={cell.x + 10}
					y={cell.y + cell.height - LABEL - LABEL_DY}
					font-size={VALUE}
					font-family={theme.fontHeadline}
					font-weight="600"
					fill={inkOf(cell.row, rank, hovered)}
				>
					{format(cell.row)}
				</text>
			{/if}
		</g>
	{/each}
</Frame>
