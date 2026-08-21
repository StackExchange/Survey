<script lang="ts">
	// The top few responses as standing columns, labelled down their front faces.
	// Constant depth, or they read as five drawings rather than one row.
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { amountOf, formatOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { SKEW, slab } from '$charts/utils/iso'
	import { chars, clip, px, series, shorten, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const LABEL_SIZE = 34
	const VALUE_SIZE = 15

	let active = $state<number | null>(null)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(Math.max(0.0001, ...rows.map(amount)))

	const column = $derived(px((width * 0.72) / Math.max(rows.length, 1)))
	const thickness = $derived(px(column * 0.62))
	const depth = $derived(px(thickness * 0.55))

	// The columns step back as well as across, so the row reads in perspective.
	const stride = $derived(column)
	const rise = $derived(px(stride * SKEW * 0.35))

	const plot = $derived(px(Math.min(width * 0.5, 520)))
	const height = $derived(plot + depth * SKEW + rise * Math.max(rows.length - 1, 0) + VALUE_SIZE * 2.4)

	const y = $derived(scaleLinear().domain([0, largest]).range([0, plot]).clamp(true))

	const enter = (i: number, row: any, event: PointerEvent) => {
		active = i
		onhover?.({ title: String(row.response ?? ''), rows: [{ value: format(row), label: `#${i + 1}`, color: series(4) }] }, event)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 10)}>
	{#each rows as row, i (row.response ?? i)}
		{@const body = px(y(amount(row)))}
		{@const floor = px(plot + depth * SKEW + rise * i)}
		{@const x = px(i * stride)}
		{@const box = slab(x, floor - body, thickness, body, depth)}
		{@const label = clip(short(row.response), chars(body - 24, LABEL_SIZE))}

		<g role="presentation" onpointermove={(event) => enter(i, row, event)} onpointerleave={leave} onpointercancel={leave}>
			<!-- First child, so every label paints over it and stays selectable. The
			     handlers are on the group, so the whole row still answers the pointer. -->
			<rect {x} y="0" width={px(Math.max(thickness + depth, HIT))} height={floor} fill="transparent" />

			<g opacity={active === null || active === i ? 1 : 0.72}>
				<path d={box.side} fill={series(0)} />
				<path d={box.front} fill={series(4)} />
				<path d={box.top} fill={theme.faceTop} />

				<!-- Down the face, reading bottom-to-top: at this size the response is
				     far too long to sit under a column this narrow. -->
				<text
					transform="translate({px(x + thickness * 0.72)} {px(floor - 16)}) rotate(-90)"
					font-family={theme.fontHeadline}
					font-size={LABEL_SIZE}
					fill={theme.ink}
				>
					{label}
				</text>

				<text {x} y={px(floor + VALUE_SIZE + 8)} font-size={VALUE_SIZE} font-weight="600" fill={theme.ink}>
					{format(row)}
				</text>
			</g>
		</g>
	{/each}
</Frame>
