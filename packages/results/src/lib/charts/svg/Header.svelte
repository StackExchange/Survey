<script lang="ts">
	// The page's own header, drawn: chapter and section chips, then the question.
	import { CHIP, CHIP_SIZE, headerLayout, TITLE_SIZE, type Chrome } from '$charts/utils/chrome'
	import { hanging, middle, PAD, px, textWidth, theme } from '$charts/utils/theme'

	let { chrome, width, margin = PAD }: { chrome: Chrome; width: number; margin?: number } = $props()

	const PADDING = 8

	const layout = $derived(headerLayout(chrome, width, margin))

	// Two chips butted together, each as wide as its own label.
	const chips = $derived.by(() => {
		let x = margin

		return [
			{ text: chrome.chapter, ground: theme.ink, ink: theme.background },
			{ text: chrome.section, ground: theme.tint, ink: theme.ink },
		]
			.filter((chip) => chip.text)
			.map((chip) => {
				const w = px(textWidth(chip.text!, CHIP_SIZE) + PADDING * 2)
				const at = x

				x += w
				return { ...chip, x: at, width: w }
			})
	})
</script>

{#if layout.chips}
	{#each chips as chip, i (i)}
		<rect x={chip.x} y={margin} width={chip.width} height={CHIP} fill={chip.ground} />

		<text
			x={px(chip.x + PADDING)}
			y={middle(margin + CHIP / 2, CHIP_SIZE)}
			font-family={theme.fontHeadline}
			font-size={CHIP_SIZE}
			font-weight="500"
			fill={chip.ink}
		>
			{chip.text}
		</text>
	{/each}
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
