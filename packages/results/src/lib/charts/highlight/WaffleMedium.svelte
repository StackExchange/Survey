<script lang="ts">
	// The "1 in X" shape: X cells with one filled. Rounding is the point of the
	// form — 26% draws four cells — and the exact figure is in the `<desc>`.
	import Frame from '$charts/svg-components/SvgWrapper.svelte'
	import { amountOf, grid, oneIn, readingOf, rowsOf } from '$charts/utils/expressive'
	import { px, series, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const GAP = 14

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(amountOf(figure)(row))

	const cells = $derived(oneIn(share))
	const slots = $derived(Array.from({ length: cells }, (_, i) => i))
	const layout = $derived(grid(cells, Math.min(width, 620), GAP))

	const height = $derived(layout.height)

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: `1 in ${cells}`, color: series(3) }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
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
</Frame>
