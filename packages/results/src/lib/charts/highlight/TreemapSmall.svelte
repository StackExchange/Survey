<script lang="ts">
	// Two values as two squares. Area rather than height, so "three times more" is
	// three times the square — the sides are the square roots of the shares.
	import { amountOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { chars, clip, descent, px, series, shorten, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const GAP = 28
	const LABEL_SIZE = 13

	const rows = $derived(rowsOf(figure).slice(0, 2))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))

	// The tallest square gets the plot, and it is always the larger of the two.
	const box = $derived(px(Math.min((width - GAP) * 0.62, 340)))
	const side = (row: any) => px(box * Math.sqrt(Math.max(amount(row), 0) / largest))

	const height = $derived(box + LABEL_SIZE * 2.2 + 6 + descent(LABEL_SIZE))

	const enter = (row: any, i: number, event: PointerEvent) =>
		onhover?.({ title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: series(i) }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	<!-- Baseline-aligned, so the two areas are compared off a shared floor. -->
	{#each rows as row, i (row.response ?? i)}
		{@const s = side(row)}
		{@const x = i === 0 ? 0 : px(side(rows[0]) + GAP)}

		<g role="presentation" onpointermove={(event) => enter(row, i, event)} onpointerleave={() => onhover?.(null)}>
			<rect {x} y={px(box - s)} width={s} height={s} fill={i === 0 ? series(0) : theme.faceSide} />

			<text {x} y={px(box + LABEL_SIZE + 6)} font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>{format(row)}</text>
			<text {x} y={px(box + LABEL_SIZE * 2.2 + 6)} font-size={LABEL_SIZE} fill={theme.muted}>
				{clip(short(row.response), chars(Math.max(s, 120), LABEL_SIZE))}
			</text>
		</g>
	{/each}
</Frame>
