<script lang="ts">
	import type { Caption } from '$charts/utils/caption'

	import { icons, STATS } from '$charts/utils/chrome'
	import { chars, clip, middle, PAD, px, SMALL, textWidth, theme } from '$charts/utils/theme'

	import Glyph from './Glyph.svelte'

	let { facts, y, width, terms, margin = PAD }: { facts: Caption; y: number; width: number; terms?: string; margin?: number } = $props()

	const ICON = 20
	const ICON_GAP = 5
	const ITEM_GAP = 22

	const items = $derived(
		[
			facts.n && { icon: icons.respondents, text: facts.n },
			facts.share && { icon: icons.share, text: facts.share },
			facts.subtext && { icon: icons.note, text: facts.subtext },
		].filter(Boolean) as { icon: (typeof icons)['note']; text: string }[]
	)

	const room = $derived(width - margin - (terms ? textWidth(terms, SMALL) + ITEM_GAP : 0))

	const placed = $derived.by(() => {
		let x = margin

		return items.map((item, i) => {
			const last = i === items.length - 1
			const free = room - x - ICON - ICON_GAP
			const text = last ? clip(item.text, chars(free, SMALL)) : item.text
			const at = x

			x += ICON + ICON_GAP + textWidth(text, SMALL) + ITEM_GAP
			return { ...item, text, x: at }
		})
	})
</script>

{#each placed as item, i (i)}
	<Glyph glyph={item.icon} x={item.x} y={y + (STATS - ICON) / 2} size={ICON} />

	<text x={px(item.x + ICON + ICON_GAP)} y={middle(y + STATS / 2, SMALL)} font-size={SMALL} fill={theme.ink}>{item.text}</text>
{/each}

{#if terms}
	<text x={px(width - margin)} y={middle(y + STATS / 2, SMALL)} text-anchor="end" font-size={SMALL} fill={theme.ink}>
		{terms}
	</text>
{/if}
