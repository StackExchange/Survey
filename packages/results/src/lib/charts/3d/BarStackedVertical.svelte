<script lang="ts">
	import type { OnHover } from '$charts/utils/tooltip'

	import { amountOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, descent, DIM, px, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const hover = useHover(() => onhover)

	const ART = { column: 160, nose: 30 }
	const LABEL_SIZE = 34
	const VALUE_SIZE = 25
	const SLOPE = ART.nose / (ART.column / 2)
	const LEAN = -px((Math.atan(SLOPE) * 180) / Math.PI)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))
	const largest = $derived(largestOf(rows.map(amount)))
	const step = $derived(px(Math.min(ART.column / 0.8, width / Math.max(rows.length, 1))))
	const COLUMN = $derived(px(step * 0.8))
	const half = $derived(px(COLUMN / 2))
	const NOSE = $derived(px(COLUMN * (ART.nose / ART.column)))
	const LONGEST = $derived(px(Math.min(width * 0.5, 520)))

	const DIAMOND = $derived(`M${-half} 0L0 ${-NOSE}L${half} 0L0 ${NOSE}Z`)
	const BASE_LEFT = $derived(`M${-half} 0L0 ${-NOSE}V${NOSE}Z`)
	const BASE_RIGHT = $derived(`M${half} 0L0 ${-NOSE}V${NOSE}Z`)

	const DROP = $derived(px(step * SLOPE))

	const first = $derived(px((width - ((rows.length - 1) * step + COLUMN)) / 2 + COLUMN / 2))

	const baseline = $derived(px(NOSE + 8 + LONGEST))
	const FOOT = $derived(NOSE + VALUE_SIZE + 8 + descent(VALUE_SIZE))
	const height = $derived(baseline + (Math.max(rows.length, 1) - 1) * DROP + FOOT)

	const labelX = $derived(px(-half / 2 + LABEL_SIZE * 0.3))
	const labelY = $derived(px((NOSE * (labelX + half)) / half - 30))

	const lengthOf = (row: any) => px(Math.max(NOSE * 2, LONGEST * (amount(row) / largest)))

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), label: `#${i + 1}`, color: theme.focus }] }, event)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 10)}>
	{#each rows as row, i (row.response ?? i)}
		{@const len = lengthOf(row)}

		<g
			role="presentation"
			transform="translate({px(first + i * step)} {px(baseline + i * DROP)})"
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
		>
			<rect x={-half} y={px(-(len + NOSE))} width={px(Math.max(COLUMN, HIT))} height={px(len + NOSE * 2)} fill="transparent" />

			<g opacity={hover.active === null || hover.active === i ? 1 : DIM}>
				<rect x={-half} y={px(-len)} width={half} height={len} fill={theme.focus} />
				<rect x="0" y={px(-len)} width={half} height={len} fill={theme.rest} />

				<path d={DIAMOND} transform="translate(0 {px(-len)})" fill={theme.accent} />

				<path d={BASE_LEFT} fill={theme.focus} />
				<path d={BASE_RIGHT} fill={theme.rest} />
			</g>

			<text
				transform="translate({labelX} {labelY}) rotate(-90) skewX({LEAN})"
				font-family={theme.fontHeadline}
				font-size={LABEL_SIZE}
				fill="#201c1d"
			>
				{clip(short(row.response), chars(len - NOSE - 24, LABEL_SIZE))}
			</text>

			<text
				x={-half}
				y={px(NOSE + VALUE_SIZE + 8)}
				font-family={theme.fontHeadline}
				font-size={VALUE_SIZE}
				font-weight="600"
				fill={theme.ink}
			>
				{format(row)}
			</text>
			<text x={-half} y={px(NOSE + VALUE_SIZE + 28)} font-size="16" fill={theme.muted}>
				{short(row.response)}
			</text>
		</g>
	{/each}
</Frame>
