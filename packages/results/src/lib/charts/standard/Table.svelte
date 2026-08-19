<script lang="ts">
	// The whole table — columns, headings, formatted cells — comes from
	// $lib/table, the same builder behind DataTable and the markdown twins, so the
	// three renderings agree.
	import type { OnHover } from '$charts/utils/tooltip'

	import { chars, clip, middle, PAD, px, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'
	import { tableOf } from '$lib/table'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const ROW = 30
	const HEAD = 35
	const HEAD_SIZE = 14
	const CELL_SIZE = 14

	let active = $state<number | null>(null)

	// Nothing else on the page recovers what the ellipsis ate.
	const enter = (r: number, row: any, event: PointerEvent) => {
		active = r
		onhover?.(
			{ title: row.cells[0], rows: row.cells.slice(1).map((value: string, i: number) => ({ value, label: headers[i + 1] })) },
			event
		)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}

	const table = $derived(tableOf(figure))
	const rows = $derived(table?.rows ?? [])
	const headers = $derived(table?.headers ?? [])
	// The first column is the response and takes the space; the rest are numbers.
	const numeric = $derived(table?.numeric ?? [])
	const short = $derived(shorten(figure))

	const others = $derived(Math.max(1, headers.length - 1))
	// Past ~13 columns the two clamps fight and the last runs over the edge; the
	// widest table in the export has four.
	const restWidth = $derived(Math.min(110, (width - PAD * 2) / (others + 2)))
	const firstWidth = $derived(Math.max(120, width - PAD * 2 - restWidth * others))

	const colWidth = (i: number) => (i === 0 ? firstWidth : restWidth)
	// (i - 1) narrow columns, not i: i left an empty slot and pushed the last
	// column off the canvas.
	const x = (i: number) => px(PAD + (i === 0 ? 0 : firstWidth + restWidth * (i - 1)))
	// Right-aligned columns are measured from their right edge.
	const edge = (i: number) => px(x(i) + colWidth(i) - 12)

	const height = $derived(PAD + HEAD + rows.length * ROW + PAD)
</script>

<Frame {figure} {width} {height}>
	<g transform="translate(0, {PAD})">
		{#each headers as header, i (i)}
			<text
				x={numeric[i] ? edge(i) : x(i)}
				y="14"
				text-anchor={numeric[i] ? 'end' : 'start'}
				font-size={HEAD_SIZE}
				font-weight="600"
				fill={theme.ink}
			>
				{clip(header, chars(colWidth(i) - 12, HEAD_SIZE))}
			</text>
		{/each}

		<line x1={PAD} x2={width - PAD} y1={HEAD - 6} y2={HEAD - 7} stroke={theme.ink} vector-effect="non-scaling-stroke" />

		{#each rows as row, r (r)}
			{@const y = HEAD + r * ROW}

			<!-- Banded rather than ruled: 172 rows of hairline is a lot of noise. -->
			{#if r % 2 || active === r}
				<rect
					x={PAD}
					y={y - 4}
					width={width - PAD * 2}
					height={ROW}
					fill={active === r ? theme.ink : theme.tint}
					opacity={active === r ? 0.05 : 1}
				/>
			{/if}

			{#each row.cells as value, i (i)}
				{@const text = short(value)}
				<text
					x={numeric[i] ? edge(i) : x(i)}
					y={middle(y + ROW / 2 - 4, CELL_SIZE)}
					text-anchor={numeric[i] ? 'end' : 'start'}
					font-size={CELL_SIZE}
					fill={theme.ink}
				>
					{clip(text, chars(colWidth(i) - 12, CELL_SIZE))}
				</text>
			{/each}

			<rect
				x={PAD}
				y={y + (ROW - Math.max(ROW, HIT)) / 2 - 4}
				width={width - PAD * 2}
				height={Math.max(ROW, HIT)}
				fill="transparent"
				role="presentation"
				onpointermove={(event) => enter(r, row, event)}
				onpointerleave={leave}
				onpointercancel={leave}
			/>
		{/each}
	</g>
</Frame>
