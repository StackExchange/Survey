<script lang="ts">
	import { px, theme } from '$charts/utils/theme'

	let { from, to, top, bottom }: { from: number; to: number; top: number; bottom: number } = $props()

	const MARKS = [0, 0.25, 0.5, 0.75, 1]
</script>

{#each MARKS as mark (mark)}
	{@const at = px(from + (to - from) * mark)}

	<line x1={at} x2={at} y1={px(top)} y2={px(bottom)} stroke={theme.grid} stroke-width="1" stroke-linecap="round" stroke-dasharray="0.1 4" />
{/each}
