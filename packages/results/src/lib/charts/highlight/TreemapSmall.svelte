<script lang="ts">
	// Two values as two squares. Area rather than height, so "three times more" is
	// three times the square — the sides are the square roots of the shares.
	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, descent, px, series, shorten, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const GAP = 28
	const LABEL_SIZE = 13

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure).slice(0, 2))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))

	// Two squares only, so a focus past them leaves the accent where it was. A
	// focus is drawn in the chapter's colour; the default keeps the palette's first.
	const focused = $derived(focusedOf(figure))
	const accent = $derived(rows.includes(focused) ? focused : rows[0])
	const accentFill = $derived(accent === focused ? theme.focus : series(0))
	// Pointer first, then the accent: hovering any mark — the focused one included —
	// turns it black, and the accent is what is drawn when the pointer is elsewhere.
	// `ink`/`background` are a pair, so that reads black on a light page and white on
	// a dark one.
	const fillOf = (row: any, hovered: boolean) => (hovered ? theme.ink : row === accent ? accentFill : theme.faceSide)

	// The tallest square gets the plot, and it is always the larger of the two.
	const box = $derived(px(Math.min((width - GAP) * 0.62, 340)))
	const side = (row: any) => px(box * Math.sqrt(Math.max(amount(row), 0) / largest))

	const height = $derived(box + LABEL_SIZE * 2.2 + 6 + descent(LABEL_SIZE))

	// The pair is only as wide as the two shares make it, so centre it in the frame
	// rather than leaving all the slack on the right.
	const origin = $derived(px((width - (side(rows[0]) + GAP + side(rows[1] ?? rows[0]))) / 2))

	const enter = (row: any, i: number, event: PointerEvent) =>
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: series(i) }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	<!-- Baseline-aligned, so the two areas are compared off a shared floor. -->
	<g transform="translate({origin} 0)">
		{#each rows as row, i (row.response ?? i)}
			{@const s = side(row)}
			{@const x = i === 0 ? 0 : px(side(rows[0]) + GAP)}

			<g role="presentation" onpointermove={(event) => enter(row, i, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
				<rect {x} y={px(box - s)} width={s} height={s} fill={fillOf(row, hover.active === i)} />

				<text {x} y={px(box + LABEL_SIZE + 6)} font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>{format(row)}</text>
				<text {x} y={px(box + LABEL_SIZE * 2.2 + 6)} font-size={LABEL_SIZE} fill={theme.muted}>
					{clip(short(row.response), chars(Math.max(s, 120), LABEL_SIZE))}
				</text>
			</g>
		{/each}
	</g>
</Frame>
