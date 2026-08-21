<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'

	import { LOGO, logo, LOGO_PAD, MASTHEAD } from '$charts/utils/chrome'
	import { middle, PAD, px, theme } from '$charts/utils/theme'

	import Glyph from './Glyph.svelte'

	let { chrome, width, margin = PAD }: { chrome: Chrome; width: number; margin?: number } = $props()

	const SIZE = 14

	const survey = $derived(`Developer Survey ${chrome.year ?? ''}`.trim())
	const site = $derived((chrome.url ?? '').replace(/^https?:\/\//, ''))
	const mark = $derived(px((logo.width / logo.height) * LOGO))
	const block = $derived(px(mark + LOGO_PAD * 2))
	const left = $derived(px(width - block))
</script>

<rect x="0" y="0" width={px(width)} height={MASTHEAD} fill={theme.ink} />

<Glyph glyph={logo} x={left + LOGO_PAD} y={(MASTHEAD - LOGO) / 2} size={LOGO} fill={theme.accent} />

<text x={margin} y={middle(MASTHEAD / 2, SIZE)} font-size={SIZE} fill={theme.background}>
	<tspan font-weight="600">{survey}</tspan>&nbsp;&nbsp;&nbsp;{#if site}<tspan>{site}</tspan>{/if}
</text>
