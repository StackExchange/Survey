<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { scaleLinear } from 'd3-scale'

	import { useDomain, useFocus } from '$charts/utils/chrome'
	import { amountOf, formatOf, rowsOf, valueOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import {
		chars,
		clip,
		count,
		describeTooltip,
		digitsWidth,
		GAP,
		HIT,
		HOVER_WASH,
		LABEL,
		labelGutter,
		labelsAbove,
		middle,
		PAD,
		px,
		series,
		shorten,
		theme,
	} from '$charts/utils/theme'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// Row height is composed from these, so a bar can't get thicker than its row.
	const BAR = 25
	const LINE = 20
	const VALUE_GAP = 8

	// No-op unless an export asked for a focus.
	const dim = useFocus()
	const domain = useDomain()
	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const value = $derived(valueOf(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	// A share is drawn against a full 0–1 unless normalising; a value has no
	// natural maximum, so it scales to the largest in the set.
	const scale = $derived(value ? Math.max(1, ...rows.map(amount)) : domain(rows.map(amount)))

	const labelAbove = $derived(labelsAbove(width, LABEL))
	const labelWidth = $derived(labelGutter(width))

	// Reserved from the widest label it will actually draw.
	const valueWidth = $derived(Math.ceil(Math.max(24, ...rows.map((row: any) => digitsWidth(format(row), LABEL)))) + 12)
	const plotX = $derived(labelAbove ? PAD : labelWidth + 12)
	const plotWidth = $derived(Math.max(1, width - plotX - valueWidth - PAD))

	const x = $derived(scaleLinear().domain([0, scale]).range([0, plotWidth]).clamp(true))

	// Stacked, a row carries a line of text as well as the bar.
	const ROW = $derived(labelAbove ? LINE + BAR + GAP : BAR + GAP)
	const height = $derived(PAD + rows.length * ROW + PAD)

	const describe = (row: any) => ({
		title: String(row.response ?? ''),
		rows: [
			{ value: format(row), label: value?.label ?? 'of respondents', color: series(0) },
			...(row.count ? [{ value: count(row.count), label: 'respondents' }] : []),
		],
	})
</script>

<Frame {figure} {width} {height}>
	<Gridlines from={plotX} to={plotX + plotWidth} top={PAD} bottom={PAD + rows.length * ROW} />

	{#each rows as row, i (row.response ?? i)}
		{@const y = PAD + i * ROW}
		{@const bar = amount(row) ? Math.max(1, px(x(amount(row)))) : 0}
		{@const label = clip(short(row.response), chars(width - PAD * 2, LABEL))}
		{@const data = describe(row)}

		<!-- Focusable so a keyboard-only user can reach the tooltip a pointer gets; `role="img"` isn't a widget role, so the linter can't tell this is deliberate. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<g
			opacity={dim(row.response)}
			role="img"
			aria-label={describeTooltip(data)}
			tabindex="0"
			onpointerdown={(event) => hover.enter(i, data, event)}
			onpointermove={(event) => hover.enter(i, data, event)}
			onpointerleave={hover.leave}
			onpointercancel={hover.leave}
			onfocus={(event) => hover.enter(i, data, event)}
			onblur={hover.leave}
		>
			<!-- Hit target first, so labels stay selectable. -->
			<rect x="0" y={y + (ROW - Math.max(ROW, HIT)) / 2} {width} height={Math.max(ROW, HIT)} fill="transparent" />

			{#if hover.active === i}
				<rect x="0" {y} {width} height={ROW} fill={theme.ink} opacity={HOVER_WASH} />
			{/if}

			<!-- For smaller screens we stack the labels -->
			{#if labelAbove}
				<text x={PAD} y={middle(y + LINE / 2.5, LABEL)} font-size={LABEL} fill={theme.ink}>
					{label}
				</text>

				<text
					x={px(plotX + bar + VALUE_GAP)}
					y={middle(y + ROW / 1.6, LABEL)}
					font-size={LABEL}
					font-family={theme.fontHeadline}
					font-weight="600"
					fill={theme.ink}
				>
					{format(row)}
				</text>

				<rect x={plotX} y={y + LINE} width={bar} height={BAR} fill={series(0)} />
			{:else}
				<text x={PAD} y={middle(y + ROW / 2, LABEL)} font-size={LABEL} fill={theme.ink}>
					{clip(short(row.response), chars(labelWidth, LABEL))}
				</text>

				<rect x={plotX} y={y + (ROW - BAR) / 2} width={bar} height={BAR} fill={series(0)} />

				<text
					x={px(plotX + bar + VALUE_GAP)}
					y={middle(y + ROW / 2, LABEL)}
					font-size={LABEL}
					font-family={theme.fontHeadline}
					font-weight="600"
					fill={theme.ink}
				>
					{format(row)}
				</text>
			{/if}
		</g>
	{/each}
</Frame>
