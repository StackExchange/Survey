<script lang="ts">
	import type { OnHover } from '$charts/utils/tooltip'

	import { scaleLinear } from 'd3-scale'

	import { useDomain, useFocus } from '$charts/utils/chrome'
	import {
		chars,
		clip,
		count,
		digitsWidth,
		labelGutter,
		labelsAbove,
		middle,
		PAD,
		percent,
		px,
		series,
		shorten,
		theme,
	} from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// Dims every row but the focused ones. No-op unless an export asked for it.
	const dim = useFocus()
	const domain = useDomain()

	// Row height is composed from these, so a bar can't get thicker than its row.
	const BAR = 25
	const GAP = 8
	const LINE = 20

	const LABEL_SIZE = 14

	let active = $state<number | null>(null)

	// The drawn label is shortened then clipped, so the readout is the only place
	// the response appears in full.
	const enter = (i: number, row: any, event: PointerEvent) => {
		active = i
		onhover?.(
			{
				title: String(row.response ?? ''),
				rows: [
					{ value: format(row), label: value?.label ?? 'of respondents', color: series(0) },
					...(row.count ? [{ value: count(row.count), label: 'respondents' }] : []),
				],
			},
			event
		)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}

	const rows = $derived((figure.data ?? []).filter(Boolean))
	const short = $derived(shorten(figure))

	// The salary questions carry {key, label, unit}; everything else is a share.
	const value = $derived(figure.value ?? null)
	const unit = $derived(value?.unit ?? '')

	const amount = (row: any) => (value ? (row[value.key] ?? 0) : (row.pct ?? 0))
	const format = (row: any) => (value ? `${unit}${count(amount(row))}` : percent(amount(row)))

	// A share is drawn against a full 0–1 unless normalising; a value has no
	// natural maximum, so it scales to the largest in the set.
	const scale = $derived(value ? Math.max(1, ...rows.map(amount)) : domain(rows.map(amount)))

	const labelAbove = $derived(labelsAbove(width, LABEL_SIZE))

	const labelWidth = $derived(labelGutter(width))

	// Reserved from the widest label it will actually draw.
	const valueWidth = $derived(Math.ceil(Math.max(24, ...rows.map((row: any) => digitsWidth(format(row), LABEL_SIZE)))) + 12)
	const plotX = $derived(labelAbove ? PAD : labelWidth + 12)
	const plotWidth = $derived(Math.max(1, width - plotX - valueWidth - PAD))

	const x = $derived(scaleLinear().domain([0, scale]).range([0, plotWidth]).clamp(true))

	// Stacked rows carry a line of text as well as the bar.
	const ROW = $derived(labelAbove ? LINE + BAR + GAP : BAR + GAP)
	const height = $derived(PAD + rows.length * ROW + PAD)
</script>

<Frame {figure} {width} {height}>
	<Gridlines from={plotX} to={plotX + plotWidth} top={PAD} bottom={PAD + rows.length * ROW} />

	{#each rows as row, i (row.response ?? i)}
		{@const y = PAD + i * ROW}
		{@const bar = amount(row) ? Math.max(1, px(x(amount(row)))) : 0}
		{@const label = clip(short(row.response), chars(width - PAD * 2, LABEL_SIZE))}

		<g
			opacity={dim(row.response)}
			role="presentation"
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={leave}
			onpointercancel={leave}
		>
			<!-- First child, so every label paints over it and stays selectable. The
			     handlers are on the group, so the whole row still answers the pointer. -->
			<rect x="0" y={y + (ROW - Math.max(ROW, HIT)) / 2} {width} height={Math.max(ROW, HIT)} fill="transparent" />

			{#if active === i}
				<rect x="0" {y} {width} height={ROW} fill={theme.ink} opacity="0.05" />
			{/if}

			{#if labelAbove}
				<text x={PAD} y={middle(y + LINE / 2, LABEL_SIZE)} font-size={LABEL_SIZE} fill={theme.ink}>
					{label}
				</text>

				<text x={px(plotX + bar + 8)} y={middle(y + ROW / 1.6, LABEL_SIZE)} font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>
					{format(row)}
				</text>

				<rect x={plotX} y={y + LINE} width={bar} height={BAR} fill={series(0)} />
			{:else}
				<text x={PAD} y={middle(y + ROW / 2, LABEL_SIZE)} font-size={LABEL_SIZE} fill={theme.ink}>
					{clip(short(row.response), chars(labelWidth, LABEL_SIZE))}
				</text>

				<rect x={plotX} y={y + (ROW - BAR) / 2} width={bar} height={BAR} fill={series(0)} />

				<text x={px(plotX + bar + 8)} y={middle(y + ROW / 2, LABEL_SIZE)} font-size={LABEL_SIZE} font-weight="600" fill={theme.ink}>
					{format(row)}
				</text>
			{/if}
		</g>
	{/each}
</Frame>
