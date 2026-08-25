<script lang="ts">
	// A hundred cells, one per percentage point, ten by ten so a row is ten points.
	// One share, so the chapter's two colours: its first for the filled cells.
	import { amountOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { px, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	// No `onhover`: one value, so a readout would only repeat the `<desc>`.
	let { figure, width = 800 }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const COLUMNS = 10
	const GAP = 6

	const rows = $derived(rowsOf(figure))
	const share = $derived(
		figure.values
			? Math.min(
					rows.reduce((total: number, row: any) => total + amountOf(figure)(row), 0),
					1
				)
			: amountOf(figure)(rows[0])
	)

	// At least one cell for a real-but-tiny share, as `percent` does for "<1%".
	const filled = $derived(share > 0 ? Math.max(1, Math.round(share * 100)) : 0)

	const size = $derived(px((width - GAP * (COLUMNS - 1)) / COLUMNS))
	const height = $derived(COLUMNS * size + GAP * (COLUMNS - 1))

	const slots = Array.from({ length: 100 }, (_, i) => i)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each slots as i (i)}
		<rect
			x={px((i % COLUMNS) * (size + GAP))}
			y={px(Math.floor(i / COLUMNS) * (size + GAP))}
			width={size}
			height={size}
			fill={i < filled ? theme.focus : theme.rest}
		/>
	{/each}
</Frame>
