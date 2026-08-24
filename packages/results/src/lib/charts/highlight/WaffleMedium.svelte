<script lang="ts">
	// The "1 in X" shape: X cells with one filled. Rounding is the point of the
	// form — 26% draws four cells — and the exact figure is in the `<desc>`.
	import { amountOf, grid, oneIn, readingOf, rowsOf } from '$charts/utils/expressive'
	import { px, series, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const GAP = 14

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(amountOf(figure)(row))

	const cells = $derived(oneIn(share))
	const slots = $derived(Array.from({ length: cells }, (_, i) => i))
	const layout = $derived(grid(cells, Math.min(width, 620), GAP))

	// The field stops growing at 620 and a near-square grid rarely uses all of it,
	// so centre what was drawn in what was given.
	const origin = $derived(px((width - (layout.columns * layout.size + GAP * (layout.columns - 1))) / 2))

	const height = $derived(layout.height)

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: `1 in ${cells}`, color: series(3) }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	<g transform="translate({origin} 0)">
		{#each slots as i (i)}
			{@const column = i % layout.columns}
			{@const line = Math.floor(i / layout.columns)}

			<rect
				x={px(column * (layout.size + GAP))}
				y={px(line * (layout.size + GAP))}
				width={layout.size}
				height={layout.size}
				fill={i === 0 ? series(3) : theme.faceSide}
				role="presentation"
				onpointermove={enter}
				onpointerleave={() => onhover?.(null)}
			/>
		{/each}
	</g>
</Frame>
