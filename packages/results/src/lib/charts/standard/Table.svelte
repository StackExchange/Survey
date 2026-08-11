<script lang="ts">
	// Columns and cell formatting come from $lib/table, the same helpers behind
	// DataTable and the markdown twins, so the three renderings agree.
	import { cell, columns } from '$lib/table'

	import Frame from '$charts/svg-components/SvgWrapper.svelte'
	import { PAD, chars, clip, middle, px, shorten, theme } from '$charts/utils/theme'
	import { HIT, type OnHover } from '$charts/utils/tooltip'

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
			{
				title: String(row[keys[0]] ?? ''),
				rows: keys.slice(1).map((key, i) => ({ value: cell(row[key], key, figure.metadata?.labels), label: headers[i + 1] })),
			},
			event
		)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}

	const rows = $derived((figure.data ?? []).filter(Boolean))
	const keys = $derived(columns(rows))
	const short = $derived(shorten(figure))

	const headers = $derived(
		Array.isArray(figure.metadata) && figure.metadata.length === keys.length
			? figure.metadata.map(String)
			: keys.map((key) => key.replace(/_/g, ' '))
	)

	// The first column is the response and takes the space; the rest are numbers.
	const numeric = $derived(keys.map((key) => key !== keys[0] && rows.some((row: any) => typeof row[key] === 'number')))
	const others = $derived(Math.max(1, keys.length - 1))
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
		{#each keys as key, i (key)}
			<text
				x={numeric[i] ? edge(i) : x(i)}
				y="14"
				text-anchor={numeric[i] ? 'end' : 'start'}
				font-size={HEAD_SIZE}
				font-weight="600"
				fill={theme.ink}
			>
				{clip(headers[i], chars(colWidth(i) - 12, HEAD_SIZE))}
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

			{#each keys as key, i (key)}
				{@const text = short(cell(row[key], key, figure.metadata?.labels))}
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
