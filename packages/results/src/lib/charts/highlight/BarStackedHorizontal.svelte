<script lang="ts">
	// A row per response, split into the share that answered and the remainder.
	// Row length is a share of the largest response so the set fills the width;
	// the split inside it is against 100%.
	import { scaleLinear } from 'd3-scale'

	import Frame from '$charts/svg/Wrap.svelte'
	import { amountOf, formatOf, readingOf, rowsOf } from '$charts/utils/expressive'
	import { chars, clip, middle, percent, px, series, shorten, theme } from '$charts/utils/theme'
	import { HIT, type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const BAR = 44
	const GAP = 14
	const LABEL_SIZE = 12

	let active = $state<number | null>(null)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const amount = $derived(amountOf(figure))
	const format = $derived(formatOf(figure))

	const largest = $derived(Math.max(0.0001, ...rows.map(amount)))
	const x = $derived(scaleLinear().domain([0, largest]).range([0, width]).clamp(true))

	const height = $derived(rows.length * (BAR + GAP))

	const enter = (i: number, row: any, event: PointerEvent) => {
		active = i
		onhover?.(
			{
				title: String(row.response ?? ''),
				rows: [
					{ value: format(row), label: 'answered this', color: theme.accent },
					{ value: percent(1 - amount(row)), label: 'did not', color: series(0) },
				],
			},
			event
		)
	}

	const leave = () => {
		active = null
		onhover?.(null)
	}
</script>

<Frame {figure} {width} {height} reading={readingOf(figure, 8)}>
	{#each rows as row, i (row.response ?? i)}
		{@const y = i * (BAR + GAP)}
		{@const length = px(x(amount(row)))}
		{@const start = px((width - length) / 2)}
		{@const split = px(length * Math.min(Math.max(amount(row), 0), 1))}

		{#if active === i}
			<rect x="0" y={y - GAP / 2} {width} height={BAR + GAP} fill={theme.ink} opacity="0.05" />
		{/if}

		<rect x={start} {y} width={split} height={BAR} fill={theme.accent} />
		<rect x={px(start + split)} {y} width={px(Math.max(length - split, 0))} height={BAR} fill={series(0)} />

		<!-- In the left margin where the row is short enough to leave one, and
		     dropped where it isn't: the rows are centred, so the margin is whatever
		     the value happens to leave, and a label can't be promised space. The
		     readout and the `<desc>` carry every response either way. -->
		{#if start > 90}
			<text x={px(start - 10)} y={middle(y + BAR / 2, LABEL_SIZE)} text-anchor="end" font-size={LABEL_SIZE} fill={theme.muted}>
				{clip(short(row.response), chars(start - 16, LABEL_SIZE))}
			</text>
		{/if}

		<rect
			x="0"
			{y}
			{width}
			height={Math.max(BAR, HIT)}
			fill="transparent"
			role="presentation"
			onpointermove={(event) => enter(i, row, event)}
			onpointerleave={leave}
			onpointercancel={leave}
		/>
	{/each}
</Frame>
