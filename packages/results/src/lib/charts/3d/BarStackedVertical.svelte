<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { amountOf, formatOf, largestOf, NOSE_RISE, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { descent, HIT, LABEL, LABEL_DY, px, shorten, theme, VALUE } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const COLUMN = 160
	const NAME_SIZE = 33

	const capColumn = (half: number, nose: number) => ({
		face: `M${-half} 0L0 ${-nose}L${half} 0L0 ${nose}Z`,
		left: `M${-half} 0L0 ${-nose}V${nose}Z`,
		right: `M${half} 0L0 ${-nose}V${nose}Z`,
	})

	const SLOPE = NOSE_RISE * 2
	const LEAN = -px((Math.atan(SLOPE) * 180) / Math.PI)
	const VALUE_GAP = 8

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))
	const largest = $derived(largestOf(rows.map(amount)))

	const step = $derived(px(Math.min(COLUMN / 0.8, width / Math.max(rows.length, 1))))
	const column = $derived(px(step * 0.8))
	const half = $derived(px(column / 2))
	const nose = $derived(px(column * NOSE_RISE))
	const longest = $derived(px(Math.min(width * 0.5, 520)))
	const drop = $derived(px(step * SLOPE))

	const cap = $derived(capColumn(half, nose))

	const first = $derived(px((width - ((rows.length - 1) * step + column)) / 2 + column / 2))
	const baseline = $derived(px(nose + 8 + longest))

	const valueY = $derived(px(nose + VALUE_GAP + VALUE))
	const labelY = $derived(px(valueY + LABEL_DY))
	const foot = $derived(labelY + descent(LABEL))
	const height = $derived(baseline + (Math.max(rows.length, 1) - 1) * drop + foot)

	const nameX = $derived(px(-half / 2 + NAME_SIZE * 0.3))
	const nameY = $derived(px((nose * (nameX + half)) / half - 20))

	const lengthOf = (row: any) => px(Math.max(nose * 2, longest * (amount(row) / largest)))

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), label: `#${i + 1}`, color: theme.focus }] }, event)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 10)}>
	{#each rows as row, i (row.response ?? i)}
		{@const len = lengthOf(row)}

		<g
			role="presentation"
			transform="translate({px(first + i * step)} {px(baseline + i * drop)})"
			onpointerdown={(event) => enter(i, row, event)}
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
		>
			<rect x={-half} y={px(-(len + nose))} width={px(Math.max(column, HIT))} height={px(len + nose * 2)} fill="transparent" />

			<rect x={-half} y={px(-len)} width={half} height={len} fill={theme.focus} />
			<rect x="0" y={px(-len)} width={half} height={len} fill={theme.rest} />

			<path d={cap.face} transform="translate(0 {px(-len)})" fill={theme.accent} />

			<path d={cap.left} fill={theme.focus} />
			<path d={cap.right} fill={theme.rest} />

			<text
				transform="translate({nameX} {nameY}) rotate(-90) skewX({LEAN})"
				font-family={theme.fontHeadline}
				font-size={NAME_SIZE}
				fill="#201c1d"
			>
				{short(row.response)}
			</text>

			<text x={-half} y={valueY} font-family={theme.fontHeadline} font-size={VALUE} font-weight="600" fill={theme.ink}>
				{format(row)}
			</text>
			<text x={-half} y={labelY} font-size={LABEL} fill={theme.muted}>
				{short(row.response)}
			</text>
		</g>
	{/each}
</Frame>
