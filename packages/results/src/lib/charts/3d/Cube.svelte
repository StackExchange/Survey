<script lang="ts">
	// Two values as two cubes on a shared floor. Sides go as the square root, not
	// the cube root: a reader compares the face they can see.
	import { amountOf, CUBE, cube, cubeHeight, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { chars, clip, descent, px, shorten, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 16
	const UNIT_SIZE = 25

	const rows = $derived(rowsOf(figure).slice(0, 2))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))

	// A cube's projected width is its side exactly — the artwork spans the full 160
	// it is scaled from — and the gap is a share of `box` too, so the row's whole
	// demand is `box * spread`. Two close values want 2.12 boxes: the 55% the
	// artwork asks for would then run 16% past the viewBox, so the fit caps it.
	const ratio = (row: any) => Math.sqrt(Math.max(amount(row), 0) / largest)
	const spread = $derived(rows.reduce((sum: number, row: any) => sum + ratio(row), 0) + (rows.length - 1) * 0.12)
	const box = $derived(px(Math.min(width * 0.55, 520, width / Math.max(spread, 1))))

	const side = (row: any) => px(box * ratio(row))
	const gap = $derived(px(box * 0.12))
	const first = $derived(px((width - box * spread) / 2))
	const floor = $derived(px(cubeHeight(box)))

	// The caption block off the horizontal bars: the unit's cap 10 clear of the
	// floor, then the name 22 further down.
	const UNIT_Y = $derived(px(floor + 10 + UNIT_SIZE))
	const NAMED_Y = $derived(px(UNIT_Y + 22))
	const height = $derived(NAMED_Y + descent(LABEL_SIZE))

	const enter = (row: any, event: PointerEvent) =>
		onhover?.({ title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: theme.focus }] }, event)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure)}>
	<!-- Largest last so a small cube in front of a big one is not painted over. -->
	{#each rows as row, i (row.response ?? i)}
		{@const s = side(row)}
		{@const x = i === 0 ? first : px(first + side(rows[0]) + gap)}

		<g
			transform={cube(x, floor - cubeHeight(s), s)}
			role="presentation"
			onpointermove={(event) => enter(row, event)}
			onpointerleave={() => onhover?.(null)}
		>
			<path d={CUBE.top} fill={theme.accent} />
			<path d={CUBE.left} fill={theme.focus} />
			<path d={CUBE.right} fill={theme.rest} />
		</g>

		<text {x} y={UNIT_Y} font-size={UNIT_SIZE} font-family={theme.fontHeadline} font-weight="600" fill={theme.ink}>{format(row)}</text>
		<text {x} y={NAMED_Y} font-size={LABEL_SIZE} fill={theme.muted}>
			{clip(short(row.response), chars(Math.min(Math.max(s, 160), width - x), LABEL_SIZE))}
		</text>
	{/each}
</Frame>
