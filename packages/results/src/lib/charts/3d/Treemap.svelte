<script lang="ts">
	// A stepped stack: one isometric plate per response, widest on the floor, each
	// smaller one resting on the top face of the one below.
	//
	// A plate is not its response — it is everything from that response down, so the
	// band it keeps uncovered is the response itself. Sizing the plates by the running
	// total rather than by the share is what makes that band honest: the top faces are
	// nested areas, and a nested area minus the one inside it is a difference, so the
	// difference is what has to carry the number. Sized by share instead, the rims are
	// gaps between neighbours and a small response wedged under a large one can show
	// more ink than a response twice its size.
	//
	// It follows that the rows have to be a distribution — parts of one whole, summing
	// to it. Point this at a select-all question and the plates nest something that
	// doesn't, whatever the arithmetic does.
	import { amountOf, formatOf, plate, plateRise, readingOf, rowsOf } from '$charts/utils/expressive'
	import { chars, clip, descent, hanging, px, shorten, theme } from '$charts/utils/theme'
	import { type OnHover } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// The value over the response, the pairing every other 3d figure uses.
	const LABEL_SIZE = 16
	const UNIT_SIZE = 25
	// Between the two baselines. The pair hangs from the label's top rather than
	// straddling a midline, so it is the cap of the value that meets the shape.
	const NAMED_DY = 22
	// Off the plate's edge, so a label reads as beside the shape rather than touching it.
	const GAP = 16
	// Past this the rims are thinner than the labels pointing at them. The sheet's
	// `limit` is the real control; this only keeps an unlimited figure from towering.
	const MAX = 6
	// What one label occupies top to bottom, cap height down to descender.
	const BLOCK = Math.ceil(UNIT_SIZE * 0.7 + NAMED_DY + descent(LABEL_SIZE))
	// Labels hang one per plate, so a plate has to be at least a label deep or two of
	// them land on each other.
	const THINNEST = BLOCK + 4
	// How tall the stack may stand, as a share of how wide it is. The feature it sits
	// in is a column beside a paragraph, not a poster.
	const TALL = 1

	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	// Largest on the floor: a plate wider than the one under it would sit on nothing.
	const rows = $derived([...rowsOf(figure)].sort((a: any, b: any) => amount(b) - amount(a)).slice(0, MAX))
	const total = $derived(Math.max(rows.reduce((sum: number, row: any) => sum + Math.max(amount(row), 0), 0), 0.0001))

	const gutter = $derived(Math.round(width * 0.3))
	const plot = $derived(Math.max(80, width - gutter))
	const cx = $derived(gutter + plot / 2)

	// What is still to come, this plate included — so the floor is the whole of it and
	// each plate above lifts off exactly its own response.
	const remaining = $derived(rows.map((_: any, i: number) => rows.slice(i).reduce((sum: number, row: any) => sum + Math.max(amount(row), 0), 0) / total))
	const widths = $derived(remaining.map((share: number) => plot * Math.sqrt(share)))

	// Depth is the one measurement carrying nothing, so it is what gives when the stack
	// outgrows its height: the top faces keep their 30° and their areas, and the slabs
	// under them thin out until the silhouette fits.
	const natural = $derived(widths.map(plateRise))
	const rises = $derived(plateRise(widths[0] ?? 0) + plateRise(widths.at(-1) ?? 0))
	const squash = $derived(Math.min(1, (plot * TALL - rises) / Math.max(natural.reduce((sum: number, d: number) => sum + d, 0), 1)))
	const depths = $derived(natural.map((d: number) => Math.max(d * squash, THINNEST)))

	const centres = $derived(depths.reduce((run: number[], depth: number, i: number) => [...run, i === 0 ? 0 : run[i - 1] - depth], [] as number[]))

	// A label hangs from the centre of its own plate's top face — the level of the
	// diamond's left and right points, which is also the level at which the plate is
	// widest. So the label's top right corner lands on the point it belongs to, a
	// gutter's width clear of it, and every label reads as attached to one shape.
	//
	// The topmost is the exception: nothing rests on it, so its diamond is whole and
	// the space over that line is empty. Its label takes half of it back.
	const ceiling = $derived(Math.min(0, ...centres.map((cy: number, i: number) => cy - plateRise(widths[i]))))
	const floor = $derived(
		Math.max(0, ...centres.map((cy: number, i: number) => cy + plateRise(widths[i]) + depths[i]), ...centres.map((cy: number) => cy + BLOCK))
	)
	const shift = $derived(-ceiling + 6)
	const height = $derived(floor - ceiling + 4)

	const anchors = $derived(
		rows.map((_: any, i: number) => ({
			x: cx - widths[i] / 2 - GAP,
			y: centres[i] + shift - (i === rows.length - 1 ? plateRise(widths[i]) / 2 : 0),
		}))
	)

	// Each label gets the room its own plate leaves it: the narrow ones on top have
	// more of it than the floor does.
	const spans = $derived(anchors.map((anchor: { x: number }) => chars(Math.max(anchor.x - 4, 20), LABEL_SIZE)))

	const enter = (row: any, event: PointerEvent) =>
		onhover?.(
			{
				title: String(row.response ?? ''),
				rows: [{ value: format(row), label: 'of respondents', color: theme.accent }],
			},
			event
		)
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, MAX)}>
	{#each rows as row, i (row.response ?? i)}
		{@const faces = plate(cx, centres[i] + shift, widths[i], depths[i])}

		<g role="presentation" onpointermove={(event) => enter(row, event)} onpointerleave={() => onhover?.(null)}>
			<path d={faces.left} fill={theme.focus} />
			<path d={faces.right} fill={theme.rest} />
			<path d={faces.top} fill={theme.accent} />
		</g>

		{@const top = hanging(anchors[i].y, UNIT_SIZE)}
		<text
			x={px(anchors[i].x)}
			y={px(top)}
			text-anchor="end"
			font-size={UNIT_SIZE}
			font-family={theme.fontHeadline}
			font-weight="600"
			fill={theme.ink}
		>
			{format(row)}
		</text>
		<text x={px(anchors[i].x)} y={px(top + NAMED_DY)} text-anchor="end" font-size={LABEL_SIZE} fill={theme.muted}>
			{clip(short(row.response), spans[i])}
		</text>
	{/each}
</Frame>
