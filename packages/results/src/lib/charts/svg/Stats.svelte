<script lang="ts">
	// The figcaption drawn inside the `<svg>`, so it travels with the picture.
	// Nothing here is announced: the frame is one `role="img"` whose `<desc>`
	// already carries all three.
	import { icons, STATS } from '$charts/utils/chrome'
	import { chars, clip, middle, PAD, px, textWidth, theme } from '$charts/utils/theme'

	import Glyph from './Glyph.svelte'

	let {
		figure,
		y,
		width,
		n,
		share,
		margin = PAD,
	}: { figure: any; y: number; width: number; n: string; share: string | null; margin?: number } = $props()

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

	// Last one takes the remaining width — a subtext is a sentence.
	const placed = $derived.by(() => {
		let x = margin

		return items.map((item, i) => {
			const last = i === items.length - 1
			const room = width - margin - x - ICON - GAP
			const text = last ? clip(item.text, chars(room, SIZE)) : item.text
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
