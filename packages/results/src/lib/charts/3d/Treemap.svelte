<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { amountOf, formatOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { closes, opens, useDismiss } from '$charts/utils/hover.svelte'
	import { chars, clip, descent, hanging, LABEL, LABEL_DY, px, shorten, theme, VALUE } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// The plate's rise, at the cube artwork's own 160-wide scale: this is the only
	// chart that stacks them.
	const PLATE_RISE = 46.188 / 160
	const plateRise = (w: number) => w * PLATE_RISE

	// The stepped stack's plate: the cube's top face over a shallower extrusion.
	// `w` is the rhombus at its widest; `cy` is the centre of the top face.
	const plate = (cx: number, cy: number, w: number, depth: number) => {
		const hw = w / 2
		const hh = plateRise(w)
		const point = (x: number, y: number) => `${px(x)} ${px(y)}`

		return {
			top: `M${point(cx, cy - hh)}L${point(cx + hw, cy)}L${point(cx, cy + hh)}L${point(cx - hw, cy)}Z`,
			left: `M${point(cx - hw, cy)}L${point(cx, cy + hh)}L${point(cx, cy + hh + depth)}L${point(cx - hw, cy + depth)}Z`,
			right: `M${point(cx + hw, cy)}L${point(cx, cy + hh)}L${point(cx, cy + hh + depth)}L${point(cx + hw, cy + depth)}Z`,
		}
	}

	const LABEL_GAP = 16
	const MAX = 6
	const BLOCK = Math.ceil(VALUE * 0.7 + LABEL_DY + descent(LABEL))
	const THINNEST = BLOCK + 4
	const TALL = 1

	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	// Largest on the floor: a wider plate would sit on nothing.
	const rows = $derived([...rowsOf(figure)].sort((a: any, b: any) => amount(b) - amount(a)).slice(0, MAX))
	const total = $derived(
		Math.max(
			rows.reduce((sum: number, row: any) => sum + Math.max(amount(row), 0), 0),
			0.0001
		)
	)

	const gutter = $derived(Math.round(width * 0.3))
	const plot = $derived(Math.max(80, width - gutter))
	const cx = $derived(gutter + plot / 2)

	// What is still to come, this plate included, so each plate above lifts off
	// exactly its own response.
	const remaining = $derived(
		rows.map((_: any, i: number) => rows.slice(i).reduce((sum: number, row: any) => sum + Math.max(amount(row), 0), 0) / total)
	)
	const widths = $derived(remaining.map((share: number) => plot * Math.sqrt(share)))

	// Depth carries nothing, so it is what gives when the stack outgrows its
	// height: the top faces keep their 30° and their areas.
	const natural = $derived(widths.map(plateRise))
	const rises = $derived(plateRise(widths[0] ?? 0) + plateRise(widths.at(-1) ?? 0))
	const squash = $derived(
		Math.min(
			1,
			(plot * TALL - rises) /
				Math.max(
					natural.reduce((sum: number, d: number) => sum + d, 0),
					1
				)
		)
	)
	const depths = $derived(natural.map((d: number) => Math.max(d * squash, THINNEST)))

	const centres = $derived(
		depths.reduce((run: number[], depth: number, i: number) => [...run, i === 0 ? 0 : run[i - 1] - depth], [] as number[])
	)

	// A label hangs from the centre of its plate's top face, where the plate is
	// widest. The topmost is whole, so its label takes back half the space over it.
	const ceiling = $derived(Math.min(0, ...centres.map((cy: number, i: number) => cy - plateRise(widths[i]))))
	const floor = $derived(
		Math.max(
			0,
			...centres.map((cy: number, i: number) => cy + plateRise(widths[i]) + depths[i]),
			...centres.map((cy: number) => cy + BLOCK)
		)
	)
	const shift = $derived(-ceiling + 6)
	const height = $derived(floor - ceiling + 4)

	const anchors = $derived(
		rows.map((_: any, i: number) => ({
			x: cx - widths[i] / 2 - LABEL_GAP,
			y: centres[i] + shift - (i === rows.length - 1 ? plateRise(widths[i]) / 2 : 0),
		}))
	)

	const spans = $derived(anchors.map((anchor: { x: number }) => chars(Math.max(anchor.x - 4, 20), LABEL)))

	const enter = (row: any, event: PointerEvent) => {
		if (!opens(event)) return
		onhover?.(
			{
				title: String(row.response ?? ''),
				rows: [{ value: format(row), label: 'of respondents', color: theme.accent }],
			},
			event
		)
	}

	const leave = (event?: PointerEvent) => closes(event) && onhover?.(null)

	useDismiss(() => onhover?.(null))
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, MAX)}>
	{#each rows as row, i (row.response ?? i)}
		{@const faces = plate(cx, centres[i] + shift, widths[i], depths[i])}

		<g
			role="presentation"
			onpointerdown={(event) => enter(row, event)}
			onpointermove={(event) => enter(row, event)}
			onpointerleave={leave}
			onpointercancel={leave}
		>
			<path d={faces.left} fill={theme.focus} />
			<path d={faces.right} fill={theme.rest} />
			<path d={faces.top} fill={theme.accent} />
		</g>

		{@const valueY = hanging(anchors[i].y, VALUE)}
		<text
			x={px(anchors[i].x)}
			y={px(valueY)}
			text-anchor="end"
			font-size={VALUE}
			font-family={theme.fontHeadline}
			font-weight="600"
			fill={theme.ink}
		>
			{format(row)}
		</text>
		<text x={px(anchors[i].x)} y={px(valueY + LABEL_DY)} text-anchor="end" font-size={LABEL} fill={theme.muted}>
			{clip(short(row.response), spans[i])}
		</text>
	{/each}
</Frame>
