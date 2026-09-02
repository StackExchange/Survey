<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { useFocus } from '$charts/utils/chrome'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, HIT, HOVER_WASH, middle, PAD, px, shorten, SMALL, theme } from '$charts/utils/theme'
	import { tableOf } from '$lib/table'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const ROW = 30
	const HEAD = 35

	const hover = useHover(() => onhover)
	const dim = useFocus()

	const table = $derived(tableOf(figure))
	const rows = $derived(table?.rows ?? [])
	const headers = $derived(table?.headers ?? [])
	const numeric = $derived(table?.numeric ?? [])
	const short = $derived(shorten(figure))
	const others = $derived(Math.max(1, headers.length - 1))
	const restWidth = $derived(Math.min(110, (width - PAD * 2) / (others + 2)))
	const firstWidth = $derived(Math.max(120, width - PAD * 2 - restWidth * others))

	const colWidth = (i: number) => (i === 0 ? firstWidth : restWidth)
	const x = (i: number) => px(PAD * 2 + (i === 0 ? 0 : firstWidth + restWidth * (i - 1)))
	const edge = (i: number) => px(x(i) + colWidth(i) - PAD * 2)

	const height = $derived(PAD + HEAD + rows.length * ROW + PAD)

	const enter = (r: number, row: any, event: PointerEvent) => {
		hover.enter(
			r,
			{ title: row.cells[0], rows: row.cells.slice(1).map((value: string, i: number) => ({ value, label: headers[i + 1] })) },
			event
		)
	}
</script>

<Frame {figure} {width} {height}>
	<g transform="translate(0, {PAD})">
		{#each headers as header, i (i)}
			<text
				x={numeric[i] ? edge(i) : x(i)}
				y="14"
				text-anchor={numeric[i] ? 'end' : 'start'}
				font-size={SMALL}
				font-weight="600"
				fill={theme.ink}
			>
				{i === 0 ? '' : clip(header, chars(colWidth(i) - 12, SMALL))}
			</text>
		{/each}

		<line x1={PAD} x2={width - PAD} y1={HEAD - 6} y2={HEAD - 7} stroke={theme.ink} vector-effect="non-scaling-stroke" />

		{#each rows as row, r (r)}
			{@const y = HEAD + r * ROW}

			<g
				opacity={dim(row.response)}
				role="presentation"
				onpointerdown={(event) => enter(r, row, event)}
				onpointermove={(event) => enter(r, row, event)}
				onpointerleave={hover.leave}
				onpointercancel={hover.leave}
			>
				<rect x={PAD} y={y + (ROW - Math.max(ROW, HIT)) / 2 - 4} width={width - PAD * 2} height={Math.max(ROW, HIT)} fill="transparent" />

				{#if r % 2 || hover.active === r}
					<rect
						x={PAD}
						y={y - 4}
						width={width - PAD * 2}
						height={ROW}
						fill={hover.active === r ? theme.ink : theme.tint}
						opacity={hover.active === r ? HOVER_WASH : 1}
					/>
				{/if}

				{#each row.cells as value, i (i)}
					{@const text = short(value)}
					<text
						x={numeric[i] ? edge(i) : x(i)}
						y={middle(y + ROW / 2 - 4, SMALL)}
						text-anchor={numeric[i] ? 'end' : 'start'}
						font-size={SMALL}
						fill={theme.ink}
					>
						{clip(text, chars(colWidth(i) - 12, SMALL))}
					</text>
				{/each}
			</g>
		{/each}
	</g>
</Frame>
