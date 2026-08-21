<script lang="ts">
	import type { Caption } from '$charts/utils/caption'

	import { icons, STATS } from '$charts/utils/chrome'
	import { chars, clip, middle, PAD, px, textWidth, theme } from '$charts/utils/theme'

	import Glyph from './Glyph.svelte'

	let { facts, y, width, terms, margin = PAD }: { facts: Caption; y: number; width: number; terms?: string; margin?: number } = $props()

	const SIZE = 14
	const ICON = 20
	const GAP = 5
	const SPACE = 22

	const items = $derived(
		[
			facts.n && { icon: icons.respondents, text: facts.n },
			facts.share && { icon: icons.share, text: facts.share },
			facts.subtext && { icon: icons.note, text: facts.subtext },
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
