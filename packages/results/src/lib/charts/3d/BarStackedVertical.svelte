<script lang="ts">
	// Columns, height proportional to the share, labelled down their own faces.
	// Straight off the base artwork: a column split into a lit left half and a
	// shaded right half, a diamond base split the same way, and an orange cap that
	// rides the column's own top.
	//
	// The bar body runs between the two diamond centres, so each diamond covers the
	// last stretch of the bar — that overlap is what makes the ends read as solid
	// rather than as lids stuck on.
	import type { OnHover } from '$charts/utils/tooltip'

	import { amountOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, descent, DIM, px, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// Artwork proportions: a 160-wide column with a 30-tall diamond at each end.
	const ART = { column: 160, nose: 30 }
	const LABEL_SIZE = 34
	const VALUE_SIZE = 15

	// The ground the bases stand on, taken off the base diamond's own edge: (-80, 0)
	// to (0, 30) on the artwork, so a step to the right is 0.375 of that step down.
	// Fixed whatever the column scales to.
	const SLOPE = ART.nose / (ART.column / 2)

	// The same ratio as an angle. Shearing a label by it puts its cross-strokes
	// parallel to that edge, which is what makes it read as painted on the face
	// rather than laid over it — and it agrees with the ground by construction.
	const LEAN = -px((Math.atan(SLOPE) * 180) / Math.PI)

	const hover = useHover(() => onhover)

	// Order as it arrives. `limit` on the sheet takes the first N, so a figure that
	// asks for a top ten is already ranked — re-sorting here would fight it.
	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(largestOf(rows.map(amount)))

	// One slot per column, the column filling four fifths of it — so the gutter
	// scales with the count instead of being a constant that runs out. Capped at the
	// artwork's own size: a handful of responses should draw a few columns standing
	// together, not the same few stretched across the whole width.
	const step = $derived(px(Math.min(ART.column / 0.8, width / Math.max(rows.length, 1))))
	const COLUMN = $derived(px(step * 0.8))

	const half = $derived(px(COLUMN / 2))
	const NOSE = $derived(px(COLUMN * (ART.nose / ART.column)))
	const LONGEST = $derived(px(Math.min(width * 0.5, 520)))

	// Every column draws the same three shapes, so they are written once about a
	// local origin on the diamond's centre and placed with a translate. The base is
	// that same diamond split down the middle, which is what makes it read as the
	// near end of one solid.
	const DIAMOND = $derived(`M${-half} 0L0 ${-NOSE}L${half} 0L0 ${NOSE}Z`)
	const BASE_LEFT = $derived(`M${-half} 0L0 ${-NOSE}V${NOSE}Z`)
	const BASE_RIGHT = $derived(`M${half} 0L0 ${-NOSE}V${NOSE}Z`)

	// Each column stands one step further back along that ground than the last, so
	// the row recedes instead of sitting on one flat line.
	const DROP = $derived(px(step * SLOPE))

	// Centred on whatever is left over once the columns have taken their own width.
	const first = $derived(px((width - ((rows.length - 1) * step + COLUMN)) / 2 + COLUMN / 2))

	// Room for the cap above and the share below. Only the first column's cap can
	// reach the top — every later one starts lower — so the lead is measured off it.
	const baseline = $derived(px(NOSE + 8 + LONGEST))
	// The last column stands lowest, and its share hangs under that — measured to the
	// descender, since an `<svg>` clips at its viewBox.
	const FOOT = $derived(NOSE + VALUE_SIZE + 8 + descent(VALUE_SIZE))
	const height = $derived(baseline + (Math.max(rows.length, 1) - 1) * DROP + FOOT)

	// Centred on the left face: the glyph block runs a cap height left of its own
	// baseline, so the baseline sits that far right of the face's middle.
	const labelX = $derived(px(-half / 2 + LABEL_SIZE * 0.35))
	// The face's foot slopes, so its height at the label's own x, less a little air.
	const labelY = $derived(px((NOSE * (labelX + half)) / half - 8))

	// Never shorter than its own two ends, or the cap swallows the base.
	const lengthOf = (row: any) => px(Math.max(NOSE * 2, LONGEST * (amount(row) / largest)))

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), label: `#${i + 1}`, color: theme.focus }] }, event)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 10)}>
	{#each rows as row, i (row.response ?? i)}
		{@const len = lengthOf(row)}

		<!-- Origin on this column's base-diamond centre, so nothing below carries the
		     column offset and the two diamonds share one coordinate system. -->
		<g
			role="presentation"
			transform="translate({px(first + i * step)} {px(baseline + i * DROP)})"
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
		>
			<!-- First child, so every label paints over it and stays selectable. The
			     handlers are on the group, so the whole column still answers the pointer. -->
			<rect x={-half} y={px(-(len + NOSE))} width={px(Math.max(COLUMN, HIT))} height={px(len + NOSE * 2)} fill="transparent" />

			<g opacity={hover.active === null || hover.active === i ? 1 : DIM}>
				<!-- bar-top — the chapter's primary, i.e. `--chart-focus`. -->
				<rect x={-half} y={px(-len)} width={half} height={len} fill={theme.focus} />
				<!-- bar-bottom — the chapter's secondary, i.e. `--chart-rest`. -->
				<rect x="0" y={px(-len)} width={half} height={len} fill={theme.rest} />

				<!-- cap — orange whatever the chapter is, and only ever moved. Drawn after
				     the body, because it covers the column's top stretch. -->
				<path d={DIAMOND} transform="translate(0 {px(-len)})" fill={theme.accent} />

				<!-- The base's two halves carry the body's own colours, so the overlap at
				     the bottom of the column is invisible. -->
				<path d={BASE_LEFT} fill={theme.focus} />
				<path d={BASE_RIGHT} fill={theme.rest} />
			</g>

			<!-- Up the left face, reading bottom-to-top: at this size the response is far
			     too long to sit under a column this narrow. `rotate` turns it up the
			     column, `skewX` then leans it onto the face — applied before the rotate,
			     so it shears across the glyphs rather than along them. Rotated glyphs
			     grow left of their baseline, hence the offset that centres the block. -->
			<text
				transform="translate({labelX} {labelY}) rotate(-90) skewX({LEAN})"
				font-family={theme.fontHeadline}
				font-size={LABEL_SIZE}
				fill={theme.ink}
			>
				{clip(short(row.response), chars(len - NOSE - 24, LABEL_SIZE))}
			</text>

			<text x="0" y={px(NOSE + VALUE_SIZE + 8)} text-anchor="middle" font-size={VALUE_SIZE} font-weight="600" fill={theme.ink}>
				{format(row)}
			</text>
		</g>
	{/each}
</Frame>
