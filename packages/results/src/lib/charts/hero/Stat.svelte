<script lang="ts">
	// One number at hero scale on an isometric plinth. Extrapolated — no mockup.
	// The plinth is what keeps it in the same family as the other nine.
	import type { OnHover } from '$charts/utils/tooltip'

	import { formatOf, readingOf, rowsOf, splitUnit } from '$charts/utils/expressive'
	import { slab } from '$charts/utils/iso'
	import { chars, clip, px, series, shorten, theme } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000 }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 18

	const row = $derived(rowsOf(figure)[0])
	const short = $derived(shorten(figure))

	const { figures, unit } = $derived(splitUnit(row ? formatOf(figure)(row) : '—'))

	const SIZE = $derived(px(Math.min(width * 0.34, 380)))
	const plinth = $derived(px(SIZE * 0.16))

	const box = $derived(slab(0, SIZE * 1.02, Math.min(width * 0.6, 640), plinth, plinth * 1.6))
	const height = $derived(SIZE * 1.02 + plinth + box.rise + LABEL_SIZE * 2.4)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	<path d={box.side} fill={theme.faceSide} />
	<path d={box.front} fill={series(0)} />
	<path d={box.top} fill={theme.faceTop} />

	<text x="0" y={px(SIZE * 0.84)} font-family={theme.fontHeadline} font-size={SIZE} font-weight="500" fill={theme.ink}>
		{figures}<tspan font-size={px(SIZE * 0.34)}>{unit}</tspan>
	</text>

	{#if row}
		<text x="0" y={px(SIZE * 1.02 + plinth + box.rise + LABEL_SIZE + 4)} font-size={LABEL_SIZE} fill={theme.muted}>
			{clip(short(row.response), chars(width, LABEL_SIZE))}
		</text>
	{/if}
</Frame>
