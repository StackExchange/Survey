<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'

	import { LOGO, logo, LOGO_PAD, MASTHEAD } from '$charts/utils/chrome'
	import { middle, PAD, px, textWidth, theme } from '$charts/utils/theme'

	import Glyph from './Glyph.svelte'

	let { chrome, width, margin = PAD }: { chrome: Chrome; width: number; margin?: number } = $props()

	const SIZE = 14

	const survey = $derived(`Developer Survey ${chrome.year ?? ''}`.trim())
	const site = $derived((chrome.url ?? '').replace(/^https?:\/\//, ''))
	// Figma collapses a <text> to one style, so the two weights are two nodes and
	// the gap between them is measured rather than spaced with nbsp.
	const GAP = 14
	const url = $derived(px(margin + textWidth(survey, SIZE) + GAP))
	const mark = $derived(px((logo.width / logo.height) * LOGO))
	const block = $derived(px(mark + LOGO_PAD * 1.5))
	const left = $derived(px(width - block))
</script>

<rect x="0" y="0" width={px(width)} height={MASTHEAD} fill={theme.ink} />

<Glyph glyph={logo} x={left + LOGO_PAD} y={(MASTHEAD - LOGO) / 2} size={LOGO} fill={theme.accent} />

<text x={margin} y={middle(MASTHEAD / 2, SIZE)} font-size={SIZE} font-weight="600" fill={theme.background}>{survey}</text>

{#if site}
	<text x={url} y={middle(MASTHEAD / 2, SIZE)} font-size={SIZE} font-weight="400" fill={theme.background}>{site}</text>
{/if}
