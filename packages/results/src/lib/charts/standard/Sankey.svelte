<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { sankey as layout, sankeyLinkHorizontal } from 'd3-sankey'

	import { rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, count, describeTooltip, HIT, middle, PAD, percent, px, series, shorten, SMALL, theme } from '$charts/utils/theme'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	const hover = useHover(() => onhover)

	const NODE_WIDTH = 14
	const NODE_PADDING = 12
	const ROW = 60
	const HEAD = 28
	const labelWidth = $derived(Math.round(width * 0.2))

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))

	// Axis labels: value set in the content sheet
	const GENERIC = new Set(['Segment', 'Response'])
	const headerOf = (key: string) => {
		const header = figure?.columns?.find((column: any) => column.key === key)?.header
		if (!header || GENERIC.has(header) || header === figure?.name || header === figure?.question) return undefined
		return String(header)
	}
	const heads = $derived.by(() => {
		const [left, right] = figure?.axisLabels ?? []
		return { left: left || headerOf('response'), right: right || headerOf('series') }
	})

	const headRoom = $derived(chars(width / 2 - PAD * 2, SMALL))

	// One id list spans both columns, so a language keeps its colour
	const names = $derived([...new Set(rows.flatMap((row: any) => [row.response, row.series]))].filter(Boolean) as string[])
	const labels = $derived(names.map(short))
	const idOf = $derived(new Map(names.map((name: string, i: number) => [name, i])))

	// Only the ids a column uses
	const columns = $derived.by(() => {
		const sources = new Set(rows.map((row: any) => idOf.get(row.response)))
		const targets = new Set(rows.map((row: any) => idOf.get(row.series)))
		const ids = names.map((_: string, i: number) => i)

		return { left: ids.filter((i: number) => sources.has(i)), right: ids.filter((i: number) => targets.has(i)) }
	})

	const plotHeight = $derived(Math.max(200, Math.max(columns.left.length, columns.right.length) * ROW))
	const height = $derived(PAD * 3 + HEAD + plotHeight)

	const graph = $derived.by(() => {
		if (!columns.left.length || !columns.right.length) return { nodes: [], links: [] }

		const left = new Map(columns.left.map((id: number, i: number) => [id, i]))
		const right = new Map(columns.right.map((id: number, i: number) => [id, columns.left.length + i]))
		const x0 = labelWidth

		return layout<{ name: string; label: number }, { value: number }>()
			.nodeWidth(NODE_WIDTH)
			.nodePadding(NODE_PADDING)
			.extent([
				[x0, HEAD],
				[Math.max(x0 + NODE_WIDTH * 3, width - labelWidth), HEAD + plotHeight],
			])({
			nodes: [...columns.left, ...columns.right].map((id: number) => ({ name: labels[id], label: id })),
			links: rows.map((row: any) => ({
				source: left.get(idOf.get(row.response)!),
				target: right.get(idOf.get(row.series)!),
				value: row.count ?? 0,
			})),
		}) as { nodes: any[]; links: any[] }
	})

	// d3-sankey writes full float precision we don't need so we round them
	const link = sankeyLinkHorizontal()
		.source((edge: any) => [px(edge.source.x1), px(edge.y0)])
		.target((edge: any) => [px(edge.target.x0), px(edge.y1)])

	const strand = (edge: any) => String(link(edge) ?? '')
	const hue = (node: any) => series(node.label ?? 0)

	const full = (node: any) => names[node.label] ?? node.name

	const describe = (edge: any) => ({
		title: `${full(edge.source)} → ${full(edge.target)}`,
		rows: [
			{ value: count(edge.value), label: 'respondents', color: hue(edge.source) },
			// This strand's share of everyone in the source node.
			{ value: percent(edge.value / Math.max(1, edge.source.value)), label: `of ${full(edge.source)} users` },
		],
	})
</script>

<Frame {figure} {width} {height}>
	<g transform="translate(0, {PAD})">
		{#if graph.nodes.length}
			{#if heads.left}
				<text x={PAD} y={HEAD - 12} font-size={SMALL} font-weight="600" fill={theme.muted}>
					{clip(heads.left, headRoom)}
				</text>
			{/if}
			{#if heads.right}
				<text x={px(width - PAD)} y={HEAD - 12} text-anchor="end" font-size={SMALL} font-weight="600" fill={theme.muted}>
					{clip(heads.right, headRoom)}
				</text>
			{/if}
		{/if}

		{#each graph.links as edge, i (i)}
			<path
				d={strand(edge)}
				stroke={hue(edge.source)}
				stroke-width={px(Math.max(1, edge.width ?? 1))}
				fill="none"
				opacity={hover.active === null ? 0.6 : hover.active === i ? 1 : 0.12}
			/>
		{/each}

		{#each graph.links as edge, i (i)}
			{@const data = describe(edge)}

			<!-- Focusable so a keyboard-only user can reach the tooltip a pointer gets; `role="img"` isn't a widget role, so the linter can't tell this is deliberate. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<path
				d={strand(edge)}
				stroke="transparent"
				stroke-width={px(Math.max(HIT / 2, edge.width ?? 1))}
				fill="none"
				role="img"
				aria-label={describeTooltip(data)}
				tabindex="0"
				onpointerdown={(event) => hover.enter(i, data, event)}
				onpointermove={(event) => hover.enter(i, data, event)}
				onpointerleave={hover.leave}
				onpointercancel={hover.leave}
				onfocus={(event) => hover.enter(i, data, event)}
				onblur={hover.leave}
			/>
		{/each}

		{#each graph.nodes as node, i (i)}
			{@const source = i < columns.left.length}

			<rect x={px(node.x0)} y={px(node.y0)} width={px(node.x1 - node.x0)} height={px(Math.max(1, node.y1 - node.y0))} fill={hue(node)} />

			<text
				x={px(source ? node.x0 - 8 : node.x1 + 8)}
				y={middle(px((node.y0 + node.y1) / 2), SMALL)}
				text-anchor={source ? 'end' : 'start'}
				font-size={SMALL}
				fill={theme.ink}
			>
				{clip(node.name, chars(labelWidth - 8 - PAD, SMALL))}
			</text>
		{/each}
	</g>
</Frame>
