<script lang="ts">
	// Every response as a rectangle proportional to its share. A cell carries its
	// label only where it fits; the rest are in the readout and the `<desc>`.
	import { amountOf, formatOf, readingOf, rowsOf, treemapCells } from '$charts/utils/expressive'
	import { chars, clip, onSeries, series, shorten } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 13

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const height = $derived(Math.round(width * 0.62))
	const cells = $derived(treemapCells(rows, rows.map(amount), width, height))

	const enter = (cell: any, rank: number, event: PointerEvent) =>
		onhover?.(
			{ title: String(cell.row.response ?? ''), rows: [{ value: format(cell.row), label: 'of respondents', color: series(rank) }] },
			event
		)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	<!-- Coloured by position in the layout, not by row order: the cells come back
	     largest-first, so this walks the palette the way the figure reads. -->
	{#each cells as cell, rank (cell.i)}
		<g role="presentation" onpointermove={(event) => enter(cell, rank, event)} onpointerleave={() => onhover?.(null)}>
			<rect x={cell.x} y={cell.y} width={cell.width} height={cell.height} fill={series(rank)} />

			<!-- Two lines of type plus its inset, or the label would sit outside its
			     own cell on the small ones. -->
			{#if cell.height > LABEL_SIZE * 3 && cell.width > 70}
				<text x={cell.x + 10} y={cell.y + LABEL_SIZE + 6} font-size={LABEL_SIZE} fill={onSeries(rank)}>
					{clip(short(cell.row.response), chars(cell.width - 20, LABEL_SIZE))}
				</text>
				<text x={cell.x + 10} y={cell.y + LABEL_SIZE * 2 + 8} font-size={LABEL_SIZE} font-weight="600" fill={onSeries(rank)}>
					{format(cell.row)}
				</text>
			{/if}
		</g>
	{/each}
</Frame>
