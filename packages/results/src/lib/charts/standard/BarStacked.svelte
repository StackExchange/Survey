<script lang="ts">
	// The Likert shape. Rows arrive flat, one per (statement, segment).
	import type { OnHover } from '$charts/utils/theme'

	import { scaleLinear } from 'd3-scale'

	import { useFocus } from '$charts/utils/chrome'
	import { useHover } from '$charts/utils/hover.svelte'
	import {
		chars,
		clip,
		count,
		describeTooltip,
		hanging,
		HIT,
		HOVER_WASH,
		legend,
		middle,
		onSeries,
		PAD,
		percent,
		px,
		series,
		shorten,
		SMALL,
		textWidth,
		theme,
	} from '$charts/utils/theme'
	import { bySeries } from '$lib/table'

	import Gridlines from '$charts/svg/Gridlines.svelte'
	import Legend from '$charts/svg/Legend.svelte'
	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// No-op unless an export asked for a focus.
	const dim = useFocus()

	const LABEL_ROW = 18
	const BAR = 25
	const ROW_GAP = 18

	const hover = useHover(() => onhover)

	const short = $derived(shorten(figure))
	const names = $derived(figure.series ?? [])
	const labels = $derived(names.map(short))

	// Segments stack at the running sum before them: the export ships no offset.
	const rows = $derived(
		bySeries(figure.data, names).map(({ response, cells }) => {
			let offset = 0

			return {
				response,
				segments: cells.map((cell: any) => {
					const pct = cell?.pct ?? 0
					const segment = { pct, count: cell?.count ?? null, offset }
					offset += pct
					return segment
				}),
			}
		})
	)

	const plotWidth = $derived(Math.max(1, width - PAD * 2))
	const key = $derived(legend(labels, plotWidth))

	const x = $derived(scaleLinear().domain([0, 1]).range([0, plotWidth]).clamp(true))

	const height = $derived(PAD + key.height + rows.length * (LABEL_ROW + BAR + ROW_GAP) + PAD)

	// One hit target per statement, not per segment: a 2% slice is a few pixels
	// wide, and it gives the narrow segments somewhere to show their label.
	const describe = (row: any) => ({
		title: String(row.response ?? ''),
		rows: row.segments.map((segment: any, i: number) => ({
			value: percent(segment.pct),
			label: segment.count ? `${labels[i]} · ${count(segment.count)}` : labels[i],
			color: series(i),
		})),
	})
</script>

<Frame {figure} {width} {height}>
	<g transform="translate({PAD}, {PAD})">
		<Legend layout={key} colors={labels.map((_: string, i: number) => series(i))} />

		<Gridlines from={0} to={plotWidth} top={key.height} bottom={key.height + rows.length * (LABEL_ROW + BAR + ROW_GAP)} />

		{#each rows as row, r (row.response ?? r)}
			{@const y = key.height + r * (LABEL_ROW + BAR + ROW_GAP)}
			{@const band = LABEL_ROW + BAR + ROW_GAP / 2}
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
				<rect x={-PAD} y={y - ROW_GAP / 4} width={plotWidth + PAD * 2} height={Math.max(band, HIT)} fill="transparent" />

				{#if hover.active === r}
					<rect x={-PAD} y={y - ROW_GAP / 4} width={plotWidth + PAD * 2} height={band} fill={theme.ink} opacity={HOVER_WASH} />
				{/if}

				<text y={hanging(y, SMALL)} font-size={SMALL} fill={theme.ink}>
					{clip(short(row.response), chars(plotWidth, SMALL))}
				</text>

				{#each row.segments as segment, i (i)}
					{@const left = px(x(segment.offset))}
					{@const w = px(x(segment.pct))}
					{@const value = percent(segment.pct)}
					<rect x={left} y={y + LABEL_ROW} width={w} height={BAR} fill={series(i)} />

					{#if w >= textWidth(value, SMALL) + 10}
						<text
							x={px(left + w / 2)}
							y={middle(y + LABEL_ROW + BAR / 2, SMALL)}
							text-anchor="middle"
							font-size={SMALL}
							font-family={theme.fontHeadline}
							font-weight="600"
							fill={onSeries(i)}
						>
							{value}
						</text>
					{/if}
				{/each}
			</g>
		{/each}
	</g>
</Frame>
