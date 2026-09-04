<script lang="ts">
	import { FINE, LEGEND_GAP, middle, SWATCH, theme } from '$charts/utils/theme'

	let {
		layout,
		colors,
	}: {
		layout: { items: { label: string; i: number; x: number; row: number }[]; rowHeight: number }
		colors: string[]
	} = $props()

	const TOP = 2
</script>

{#each layout.items as item (item.i)}
	<g transform="translate({item.x}, {item.row * layout.rowHeight})">
		<rect y={TOP} width={SWATCH} height={SWATCH} fill={colors[item.i]} />
		<text x={SWATCH + LEGEND_GAP} y={middle(TOP + SWATCH / 2, FINE)} font-size={FINE} fill={theme.muted}>{item.label}</text>
	</g>
{/each}
