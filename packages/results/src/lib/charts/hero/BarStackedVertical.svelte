<script lang="ts">
	// The stepped pyramid. Slab heights are equal so only the footprint varies —
	// varying both would measure the same number twice.
	import type { OnHover } from '$charts/utils/tooltip'

	import { amountOf, focusedOf, formatOf, largestOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { slab } from '$charts/utils/iso'
	import { DIM, middle, onSeries, px, series, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 1000, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const VALUE_SIZE = 16

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	// Largest at the base, so the stack narrows going up whatever order it arrives in.
	const stack = $derived([...rows].sort((a, b) => amount(b) - amount(a)))
	const focused = $derived(focusedOf(figure))
	const largest = $derived(largestOf(stack.map(amount)))

	const base = $derived(px(Math.min(width * 0.62, 620)))
	const depth = $derived(px(base * 0.42))
	const thickness = $derived(px(Math.max(28, base / (stack.length * 2.4))))

	// Values are drawn inside the slabs, so nothing is reserved below the base.
	const height = $derived(stack.length * thickness + depth * 0.5)

	// Footprint from the share, but never so narrow that the slab disappears.
	const footprint = (row: any) => px(Math.max(base * 0.22, base * (amount(row) / largest)))

	const enter = (i: number, row: any, event: PointerEvent) => {
		hover.enter(i, { title: String(row.response ?? ''), rows: [{ value: format(row), label: 'of respondents', color: series(0) }] }, event)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 6)}>
	<!-- Bottom slab first, so each one above overlaps the lid below it. -->
	{#each stack as row, i (row.response ?? i)}
		{@const w = footprint(row)}
		{@const y = px(height - (i + 1) * thickness)}
		{@const x = px((base - w) / 2)}
		{@const box = slab(x, y, w, thickness, depth * (w / base))}

		<g role="presentation" onpointermove={(event) => enter(i, row, event)} onpointerleave={hover.leave} onpointercancel={hover.leave}>
			<!-- First child, so every label paints over it and stays selectable. The
			     handlers are on the group, so the whole row still answers the pointer. -->
			<rect {x} y={px(y - box.rise)} width={Math.max(w, HIT)} height={px(thickness + box.rise)} fill="transparent" />

			<g opacity={hover.active === null || hover.active === i ? 1 : DIM}>
				<path d={box.side} fill={theme.faceSide} />
				<path d={box.front} fill={row === focused ? theme.focus : series(0)} />
				<path d={box.top} fill={theme.faceTop} />

				<text
					x={px(x + w / 2)}
					y={middle(px(y + thickness / 2), VALUE_SIZE)}
					text-anchor="middle"
					font-size={VALUE_SIZE}
					font-weight="600"
					fill={row === focused ? theme.onFocus : onSeries(0)}
				>
					{format(row)}
				</text>
			</g>
		</g>
	{/each}
</Frame>
