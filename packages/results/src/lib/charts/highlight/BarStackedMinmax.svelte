<script lang="ts">
	// The two ends of the set, found here rather than authored. The six salary
	// questions arrive as a named value instead of a share; `amountOf` handles both.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, endsOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, descent, px, series, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const CAP = 34
	const LABEL_SIZE = 13

	const hover = useHover(() => onhover)

	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	// Highest first, so the pair reads left to right as the headline says it.
	const ends = $derived(endsOf(rowsOf(figure), amount))

	const largest = $derived(largestOf(ends.map(amount)))

	const plot = $derived(px(Math.min(width * 0.75, 460)))
	const height = $derived(plot + CAP + LABEL_SIZE * 2.4 + 8 + descent(LABEL_SIZE))

	const column = $derived(px(Math.min(width * 0.22, 130)))
	const gap = $derived(px(column * 0.55))
	const y = $derived(scaleLinear().domain([0, largest]).range([0, plot]).clamp(true))

	// Two columns capped at 130 each, so the pair is far narrower than the frame:
	// centre it rather than leaving all the slack on the right.
	const origin = $derived(px((width - (column * 2 + gap)) / 2))

	// Hovering turns the bar black rather than washing the column behind it. No
	// focus: this draws the two ends of the set, so there is no row to accent.
	const fillOf = (i: number, hovered: boolean) => (hovered ? theme.ink : i === 0 ? series(0) : theme.faceSide)

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), color: series(0) }] }, event)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 2)}>
	<g transform="translate({origin} 0)">
		{#each ends as row, i (row.response ?? i)}
			{@const x = px(i * (column + gap))}
			{@const body = px(y(amount(row)))}
			{@const top = px(plot - body)}

			<rect {x} y={top} width={column} height={CAP} fill={theme.faceTop} />
			<rect {x} y={px(top + CAP)} width={column} height={body} fill={fillOf(i, hover.active === i)} />

			<text
				x={px(x + column / 2)}
				y={px(plot + CAP + LABEL_SIZE + 8)}
				text-anchor="middle"
				font-size={LABEL_SIZE}
				font-weight="600"
				fill={theme.ink}
			>
				{format(row)}
			</text>
			<text x={px(x + column / 2)} y={px(plot + CAP + LABEL_SIZE * 2.4 + 8)} text-anchor="middle" font-size={LABEL_SIZE} fill={theme.muted}>
				{clip(short(row.response), chars(column + gap, LABEL_SIZE))}
			</text>

			<rect
				{x}
				y="0"
				width={Math.max(column, HIT)}
				height={px(plot + CAP)}
				fill="transparent"
				role="presentation"
				onpointermove={(event) => enter(i, row, event)}
				onpointerleave={hover.leave}
				onpointercancel={hover.leave}
			/>
		{/each}
	</g>
</Frame>
