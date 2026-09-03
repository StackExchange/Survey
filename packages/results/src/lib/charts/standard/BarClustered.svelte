<script lang="ts">
	// A group of bars per response, one per series. Plain groups against one set
	// of scales: a nested Bar chart put an `<svg>` inside an `<svg>`.
	import type { OnHover } from '$charts/utils/theme'

	import { scaleLinear } from 'd3-scale'

	import { useDomain, useFocus } from '$charts/utils/chrome'
	import { amountOf, formatOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import {
		chars,
		clip,
		describeTooltip,
		digitsWidth,
		HIT,
		HOVER_WASH,
		labelGutter,
		legend,
		middle,
		PAD,
		px,
		series,
		shorten,
		SMALL,
		theme,
	} from '$charts/utils/theme'
	import { bySeries } from '$lib/table'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Legend from '$charts/svg/Legend.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// No-op unless an export asked for a focus.
	const dim = useFocus()
	const domain = useDomain()

	const BAR = 20
	const GROUP_GAP = 16
	const VALUE_GAP = 8

	const hover = useHover(() => onhover)

	const short = $derived(shorten(figure))

	const cuts: { key: string; label: string }[] = $derived((figure.series ?? []).map((name: string) => ({ key: name, label: short(name) })))

	const rows = $derived(bySeries(figure.data, figure.series ?? []))

	const cell = (row: any, i: number) => row.cells[i]
	const amount = $derived(amountOf(figure, cell))
	const format = $derived(formatOf(figure, cell))

	const labelWidth = $derived(labelGutter(width))
	const valueWidth = $derived(
		Math.ceil(Math.max(24, ...rows.flatMap((row: any) => cuts.map((_: any, i: number) => digitsWidth(format(row, i), SMALL))))) + 12
	)
	const plotX = $derived(labelWidth + 12)
	const plotWidth = $derived(Math.max(1, width - plotX - valueWidth - PAD))

	const top = $derived(domain(rows.flatMap((row: any) => cuts.map((_: any, i: number) => amount(row, i)))))
	const x = $derived(scaleLinear().domain([0, top]).range([0, plotWidth]).clamp(true))

	const groupHeight = $derived(cuts.length * BAR + GROUP_GAP)

	const key = $derived(
		legend(
			cuts.map((cut) => cut.label),
			Math.max(1, width - PAD * 2)
		)
	)
	const height = $derived(PAD + key.height + rows.length * groupHeight + PAD)

	// The group is the target, so the readout compares the cuts side by side.
	const describe = (row: any) => ({
		title: String(row.response ?? ''),
		rows: cuts.map((cut: any, i: number) => ({ value: format(row, i), label: cut.label, color: series(i) })),
	})
</script>

<Frame {figure} {width} {height}>
	<g transform="translate({PAD}, {PAD})">
		<Legend layout={key} colors={cuts.map((_, i) => series(i))} />
	</g>

	<Gridlines from={plotX} to={plotX + plotWidth} top={PAD + key.height} bottom={PAD + key.height + rows.length * groupHeight} />

	{#each rows as row, r (row.response ?? r)}
		{@const y = PAD + key.height + r * groupHeight}
		{@const data = describe(row)}

		<!-- Focusable so a keyboard-only user can reach the tooltip a pointer gets; `role="img"` isn't a widget role, so the linter can't tell this is deliberate. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<g
			opacity={dim(row.response)}
			role="img"
			aria-label={describeTooltip(data)}
			tabindex="0"
			onpointerdown={(event) => hover.enter(r, data, event)}
			onpointermove={(event) => hover.enter(r, data, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
			onfocus={(event) => hover.enter(r, data, event)}
			onblur={hover.leave}
		>
			<!-- Hit target first, so labels stay selectable. -->
			<rect x="0" y={y - GROUP_GAP / 2} {width} height={Math.max(groupHeight, HIT)} fill="transparent" />

			{#if hover.active === r}
				<rect x="0" y={y - GROUP_GAP / 2} {width} height={groupHeight} fill={theme.ink} opacity={HOVER_WASH} />
			{/if}

			<text x={PAD} y={middle(y + (groupHeight - GROUP_GAP) / 2, SMALL)} font-size={SMALL} fill={theme.ink}>
				{clip(short(row.response), chars(labelWidth, SMALL))}
			</text>

			{#each cuts as cut, i (cut.key)}
				{@const barY = y + i * BAR}
				{@const bar = px(x(amount(row, i)))}

				<rect x={plotX} y={barY} width={bar} height={BAR} fill={series(i)} />

				<text
					x={px(plotX + bar + VALUE_GAP)}
					y={middle(barY + BAR / 2, SMALL)}
					font-size={SMALL}
					font-family={theme.fontHeadline}
					font-weight="600"
					fill={theme.ink}
				>
					{format(row, i)}
				</text>
			{/each}
		</g>
	{/each}
</Frame>
