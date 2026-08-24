<script lang="ts">
	import type { OnHover } from '$charts/utils/tooltip'

	import { focusedOf, formatOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, middle, shorten, theme } from '$charts/utils/theme'
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
	// One colour tinted down the order: these rows place rather than differ. Opacity
	// rather than `color-mix`, so a downloaded .svg tints the same way. A focus drops
	// the ramp — see ./Treemap.svelte.
	const fillOf = (row: any, hovered: boolean) => (hovered ? theme.ink : focused && row !== focused ? theme.rest : theme.focus)
	const tintOf = (i: number, hovered: boolean) => (hovered || focused ? 1 : 1 - (0.7 * i) / Math.max(rows.length - 1, 1))
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
				rows: [{ value: format(row), label: `#${i + 1}`, color: theme.focus }],
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
			<rect x="0" {y} width={TAB} height={ROW} fill={fillOf(row, hover.active === i)} fill-opacity={tintOf(i, hover.active === i)} />

			<text x={TAB + 24} y={middle(y + ROW / 2, LABEL_SIZE)} font-family={theme.fontHeadline} font-size={LABEL_SIZE} fill={theme.ink}>
				{clip(short(row.response), chars(labelWidth, LABEL_SIZE))}
			</text>

			<text x={valueX} y={middle(y + ROW / 2, RANK_SIZE)} text-anchor="end" font-size={RANK_SIZE} fill={theme.muted}>
				#{i + 1}
			</text>
		</g>
	{/each}
</Frame>
