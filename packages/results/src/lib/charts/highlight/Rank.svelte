<script lang="ts">
	import type { OnHover } from '$charts/utils/tooltip'

	import { focusedOf, formatOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, middle, series, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const ROW = 66
	const GAP = 10
	const TAB = 36
	const LABEL_SIZE = 30
	const RANK_SIZE = 30

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const focused = $derived(focusedOf(figure))
	const fillOf = (row: any, i: number, hovered: boolean) => (hovered ? theme.ink : row === focused ? theme.focus : series(i))
	const short = $derived(shorten(figure))
	const format = $derived(formatOf(figure))

	const height = $derived(rows.length * (ROW + GAP))
	const valueX = $derived(width - 20)
	const labelWidth = $derived(width - TAB - 40 - 90)

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(
			i,
			{
				title: String(row.response ?? ''),
				rows: [{ value: format(row), label: `#${i + 1}`, color: row === focused ? theme.focus : series(i) }],
			},
			event
		)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 10)}>
	{#each rows as row, i (row.response ?? i)}
		{@const y = i * (ROW + GAP)}

		<g role="presentation" onpointermove={(event) => enter(i, row, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
			<rect x="0" {y} {width} height={Math.max(ROW, HIT)} fill="transparent" />

			<rect x={TAB} {y} width={Math.max(width - TAB, 0)} height={ROW} fill={hover.active === i ? theme.rule : theme.ghost} />
			<rect x="0" {y} width={TAB} height={ROW} fill={fillOf(row, i, hover.active === i)} />

			<text x={TAB + 24} y={middle(y + ROW / 2, LABEL_SIZE)} font-family={theme.fontHeadline} font-size={LABEL_SIZE} fill={theme.ink}>
				{clip(short(row.response), chars(labelWidth, LABEL_SIZE))}
			</text>

			<text x={valueX} y={middle(y + ROW / 2, RANK_SIZE)} text-anchor="end" font-size={RANK_SIZE} fill={theme.muted}>
				#{i + 1}
			</text>
		</g>
	{/each}
</Frame>
