<script lang="ts">
	import { icons, STATS } from '$charts/utils/chrome'
	import { chars, clip, middle, PAD, px, textWidth, theme } from '$charts/utils/theme'

	import Glyph from './Glyph.svelte'

	let {
		figure,
		y,
		width,
		n,
		share,
		terms,
		margin = PAD,
	}: { figure: any; y: number; width: number; n: string; share: string | null; terms?: string; margin?: number } = $props()

	const SIZE = 14
	const ICON = 20
	const GAP = 5
	const SPACE = 22

	const items = $derived(
		[
			n && { icon: icons.respondents, text: n },
			share && { icon: icons.share, text: share },
			figure.subtext && { icon: icons.note, text: String(figure.subtext) },
		].filter(Boolean) as { icon: (typeof icons)['note']; text: string }[]
	)

	const room = $derived(width - margin - (terms ? textWidth(terms, SIZE) + SPACE : 0))

	const placed = $derived.by(() => {
		let x = margin

		return items.map((item, i) => {
			const last = i === items.length - 1
			const free = room - x - ICON - GAP
			const text = last ? clip(item.text, chars(free, SIZE)) : item.text
			const at = x

			x += ICON + GAP + textWidth(text, SIZE) + SPACE
			return { ...item, text, x: at }
		})
	})
</script>

{#each placed as item, i (i)}
	<Glyph glyph={item.icon} x={item.x} y={y + (STATS - ICON) / 2} size={ICON} />

	<text x={px(item.x + ICON + GAP)} y={middle(y + STATS / 2, SIZE)} font-size={SIZE} fill={theme.ink}>{item.text}</text>
{/each}

{#if terms}
	<text x={px(width - margin)} y={middle(y + STATS / 2, SIZE)} text-anchor="end" font-size={SIZE} fill={theme.ink}>
		{terms}
	</text>
{/if}
