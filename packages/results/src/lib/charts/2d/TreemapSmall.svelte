<script lang="ts">
	// Two values as two squares. Area rather than height, so "three times more" is
	// three times the square — the sides are the square roots of the shares.
	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, GAP, px, shorten, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 16
	const UNIT_SIZE = 28

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure).slice(0, 2))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))

	const focused = $derived(focusedOf(figure))
	const accent = $derived(rows.includes(focused) ? focused : rows[0])
	const fillOf = (row: any, hovered: boolean) => (hovered ? theme.ink : row === accent ? theme.focus : theme.rest)
	const inkOf = (row: any, hovered: boolean) => (hovered ? theme.background : row === accent ? theme.onFocus : theme.onRest)

	const ratio = $derived(Math.sqrt(Math.min(...rows.map(amount), largest) / largest))
	const box = $derived(px(Math.min((width - GAP) / (1 + ratio), width * 0.62)))
	const side = (row: any) => px(box * Math.sqrt(Math.max(amount(row), 0) / largest))

	const height = $derived(box)

	const origin = $derived(px((width - (side(rows[0]) + GAP + side(rows[1] ?? rows[0]))) / 2))

	const enter = (row: any, i: number, event: PointerEvent) =>
		hover.enter(
			i,
			{ title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: theme.focus }] },
			event
		)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	<!-- Baseline-aligned, so the two areas are compared off a shared floor. -->
	<g transform="translate({origin} 0)">
		{#each rows as row, i (row.response ?? i)}
			{@const s = side(row)}
			{@const x = i === 0 ? 0 : px(side(rows[0]) + GAP)}

			<g role="presentation" onpointermove={(event) => enter(row, i, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
				<rect {x} y={px(box - s)} width={s} height={s} fill={fillOf(row, hover.active === i)} />

				{#if s > LABEL_SIZE * 3 && s > 70}
					<text x={px(x + 10)} y={px(box - LABEL_SIZE)} font-size={LABEL_SIZE} fill={inkOf(row, hover.active === i)}>
						{clip(short(row.response), chars(s - 20, LABEL_SIZE))}
					</text>
					<text
						x={px(x + 10)}
						y={px(box - 38)}
						font-size={UNIT_SIZE}
						font-family={theme.fontHeadline}
						font-weight="600"
						fill={inkOf(row, hover.active === i)}
					>
						{format(row)}
					</text>
				{/if}
			</g>
		{/each}
	</g>
</Frame>
