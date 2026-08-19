<script lang="ts">
	// `flatten` in ./utils/chrome.ts stripped the source's own fills, so `fill`
	// here is the only one that applies — no stylesheet to depend on.
	import type { Glyph } from '$charts/utils/chrome'

	import { px, theme } from '$charts/utils/theme'

	let { glyph, x, y, size, fill = theme.ink }: { glyph: Glyph; x: number; y: number; size: number; fill?: string } = $props()

	const scale = $derived(px(size / glyph.height, 4))
</script>

<g transform="translate({px(x)} {px(y)}) scale({scale})" {fill} role="presentation">
	{@html glyph.markup}
</g>
