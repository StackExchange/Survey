<script lang="ts">
	// A hundred cells, one per percentage point, ten by ten so a row is ten points.
	import Frame from '$charts/svg/Wrap.svelte'
	import { amountOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { percent, px, series, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const COLUMNS = 10
	const GAP = 6

	const row = $derived(rowsOf(figure)[0])
	const share = $derived(amountOf(figure)(row))

	// At least one cell for a real-but-tiny share, as `percent` does for "<1%".
	const filled = $derived(share > 0 ? Math.max(1, Math.round(share * 100)) : 0)

	const size = $derived(px((Math.min(width, 640) - GAP * (COLUMNS - 1)) / COLUMNS))
	const height = $derived(COLUMNS * size + GAP * (COLUMNS - 1))

	const slots = Array.from({ length: 100 }, (_, i) => i)

	const enter = (event: PointerEvent) =>
		onhover?.({ title: String(row?.response ?? ''), rows: [{ value: percent(share), color: series(0) }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	{#each slots as i (i)}
		<rect
			x={px((i % COLUMNS) * (size + GAP))}
			y={px(Math.floor(i / COLUMNS) * (size + GAP))}
			width={size}
			height={size}
			fill={i < filled ? series(0) : theme.ghost}
			role="presentation"
			onpointermove={enter}
			onpointerleave={() => onhover?.(null)}
		/>
	{/each}
</Frame>
