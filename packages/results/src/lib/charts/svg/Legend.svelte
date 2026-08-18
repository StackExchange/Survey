<script lang="ts">
	// Draws the layout `legend()` in ./utils/theme.ts worked out. Colours arrive
	// resolved and indexed alongside the labels.
	import { SWATCH, middle, theme } from '$charts/utils/theme'

	let {
		layout,
		colors,
	}: {
		layout: { items: { label: string; i: number; x: number; row: number }[]; rowHeight: number }
		colors: string[]
	} = $props()
</script>

{#each layout.items as item (item.i)}
	<g transform="translate({item.x}, {item.row * layout.rowHeight})">
		<rect y="2" width={SWATCH} height={SWATCH} fill={colors[item.i]} />
		<text x={SWATCH + 6} y={middle(6.5, 12)} font-size="12" fill={theme.muted}>{item.label}</text>
	</g>
{/each}
