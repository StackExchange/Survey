<script lang="ts">
	// The band under an export. Drawn by SvgWrapper for a plain export and by
	// SocialCard for a sized one, so the two cannot disagree.
	import Glyph from './Glyph.svelte'
	import { FOOTER, logo, type Chrome } from '$charts/utils/chrome'
	import { middle, PAD, px, theme } from '$charts/utils/theme'
	import { licence } from '$lib/constants'

	let { chrome, y, width, margin = PAD }: { chrome: Chrome; y: number; width: number; margin?: number } = $props()

	const SIZE = 11
	const LEAD = 14
	const LOGO_HEIGHT = 20

	const survey = $derived(`Developer Survey ${chrome.year ?? ''}`.trim())
	const site = $derived(chrome.url?.replace(/^https?:\/\//, '') ?? '')
	const terms = $derived(`Data licensed under ${licence.database.name}`)

	// Right-aligned, so both lines end on the margin whatever the URL's length.
	const right = $derived(px(width - margin))
	const first = $derived(middle(y + FOOTER / 2 - LEAD / 2, SIZE))
	const second = $derived(middle(y + FOOTER / 2 + LEAD / 2, SIZE))
</script>

<Glyph glyph={logo} x={margin} y={y + (FOOTER - LOGO_HEIGHT) / 2} size={LOGO_HEIGHT} />

<text x={right} y={first} text-anchor="end" font-size={SIZE} fill={theme.ink}>
	<tspan font-weight="600">{survey}</tspan>{#if site}<tspan>&#160;&#160;{site}</tspan>{/if}
</text>

<text x={right} y={second} text-anchor="end" font-size={SIZE} fill={theme.ink}>{terms}</text>
