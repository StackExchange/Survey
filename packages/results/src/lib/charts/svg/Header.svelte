<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'

	import { ASIDE, headerLayout, TITLE_SIZE } from '$charts/utils/chrome'
	import { hanging, PAD, px, theme } from '$charts/utils/theme'

	let { chrome, width, margin = PAD }: { chrome: Chrome; width: number; margin?: number } = $props()

	const layout = $derived(headerLayout(chrome, width, margin))
</script>

{#if chrome.demographic}
	<text x={px(width - margin)} y={hanging(layout.top, ASIDE)} text-anchor="end" font-size={ASIDE} fill={theme.muted}>
		{chrome.demographic}
	</text>
{/if}

{#each layout.lines as line, i (i)}
	<text
		x={margin}
		y={hanging(layout.top + i * (TITLE_SIZE * 1.2), TITLE_SIZE)}
		font-family={theme.fontHeadline}
		font-size={TITLE_SIZE}
		fill={theme.ink}
	>
		{line}
	</text>
{/each}
