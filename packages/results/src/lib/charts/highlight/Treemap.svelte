<script lang="ts">
	import { amountOf, focusedOf, formatOf, readingOf, rowsOf, treemapCells } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, onSeries, series, shorten, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 16
	const UNIT_SIZE = 18

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	// Square: a squarified layout gives its cells better aspect ratios the closer the
	// frame is to 1:1, and the figure is meant to read as one object.
	const height = $derived(width)
	const cells = $derived(treemapCells(rows, rows.map(amount), width, height))
	const focused = $derived(focusedOf(figure))
	// As in ./BarStackedHorizontal.svelte: the pointer outranks the focus, so
	// hovering the focused cell turns it black like any other.
	const fillOf = (row: any, rank: number, hovered: boolean) => (hovered ? theme.ink : row === focused ? theme.focus : series(rank))
	const inkOf = (row: any, rank: number, hovered: boolean) =>
		hovered ? theme.background : row === focused ? theme.onFocus : onSeries(rank)

	const enter = (cell: any, rank: number, event: PointerEvent) =>
		hover.enter(
			rank,
			{
				title: String(cell.row.response ?? ''),
				rows: [{ value: format(cell.row), label: 'of respondents', color: cell.row === focused ? theme.focus : series(rank) }],
			},
			event
		)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	{#each cells as cell, rank (cell.i)}
		{@const hovered = hover.active === rank}

		<g role="presentation" onpointermove={(event) => enter(cell, rank, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
			<rect x={cell.x} y={cell.y} width={cell.width} height={cell.height} fill={fillOf(cell.row, rank, hovered)} />

			{#if cell.height > LABEL_SIZE * 3 && cell.width > 70}
				<text x={cell.x + 10} y={cell.y + LABEL_SIZE + 6} font-size={LABEL_SIZE} fill={inkOf(cell.row, rank, hovered)}>
					{clip(short(cell.row.response), chars(cell.width - 20, LABEL_SIZE))}
				</text>
				<text
					x={cell.x + 10}
					y={cell.y + cell.height - UNIT_SIZE + 7}
					font-size={UNIT_SIZE}
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
