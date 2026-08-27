<script lang="ts">
	// Flow between two columns of one shared vocabulary, whatever the question asks.
	// The node set is that vocabulary twice, or d3-sankey builds an 8-column DAG.
	import type { OnHover } from '$charts/utils/tooltip'

	import { sankey as layout, sankeyLinkHorizontal } from 'd3-sankey'

	import { rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { chars, clip, count, middle, PAD, px, pxPath, series, shorten, SMALL, theme } from '$charts/utils/theme'
	import { HIT } from '$charts/utils/tooltip'

	import Frame from '$charts/svg/Wrap.svelte'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// A strand under the pointer, so the rest drop back and it can be followed.
	const hover = useHover(() => onhover)

	// One gradient per link, so they need a namespace of their own on the page.
	const uid = $props.id()

	const NODE_WIDTH = 14
	const NODE_PADDING = 12
	const ROW = 60
	// Room for the column headings, which hang from a baseline.
	const HEAD = 28
	// Names sit outside the columns on both sides, so the flow gives up width
	// at each end rather than the single gutter a row chart needs.
	const labelWidth = $derived(Math.round(width * 0.17))

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))

	// Headings come from the sheet's `Axis Labels`; blank draws none rather than a
	// made-up one. `columns[].header` is the fallback, minus the generator's
	// generic names and the figure's own title again — those title nothing.
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

	// One id list spans both columns, so a language keeps its colour across.
	const names = $derived([...new Set(rows.flatMap((row: any) => [row.response, row.series]))].filter(Boolean) as string[])
	const labels = $derived(names.map(short))
	const idOf = $derived(new Map(names.map((name: string, i: number) => [name, i])))

	// Only the ids a column uses: d3-sankey pushes a link-less node to the far
	// side, where it lands in the wrong column.
	const columns = $derived.by(() => {
		const sources = new Set(rows.map((row: any) => idOf.get(row.response)))
		const targets = new Set(rows.map((row: any) => idOf.get(row.series)))
		const ids = names.map((_: string, i: number) => i)
		return { left: ids.filter((i: number) => sources.has(i)), right: ids.filter((i: number) => targets.has(i)) }
	})

	const plotHeight = $derived(Math.max(200, Math.max(columns.left.length, columns.right.length) * ROW))
	const height = $derived(PAD * 2 + HEAD + plotHeight)

	const graph = $derived.by(() => {
		if (!columns.left.length || !columns.right.length) return { nodes: [], links: [] }

		const left = new Map(columns.left.map((id: number, i: number) => [id, i]))
		const right = new Map(columns.right.map((id: number, i: number) => [id, columns.left.length + i]))
		const x0 = labelWidth

		// Generics: the bare overload types nodes as `{}` and rejects these.
		return layout<{ name: string; label: number }, { value: number }>()
			.nodeWidth(NODE_WIDTH)
			.nodePadding(NODE_PADDING)
			.extent([
				[x0, HEAD],
				[Math.max(x0 + NODE_WIDTH * 3, width - labelWidth), HEAD + plotHeight],
			])({
			// `label` keeps the shared id, which colours the node.
			nodes: [...columns.left, ...columns.right].map((id: number) => ({ name: labels[id], label: id })),
			links: rows.map((row: any) => ({
				source: left.get(idOf.get(row.response)!),
				target: right.get(idOf.get(row.series)!),
				value: row.count ?? 0,
			})),
		}) as { nodes: any[]; links: any[] }
	})

	const link = sankeyLinkHorizontal()
	// d3 hands back full float precision, and it is drawn twice.
	const strand = (edge: any) => pxPath(link(edge) ?? '')

	const hue = (node: any) => series(node.label ?? 0)

	const enter = (i: number, edge: any, event: PointerEvent) => {
		hover.enter(
			i,
			{
				title: `${edge.source.name} → ${edge.target.name}`,
				rows: [
					{ value: count(edge.value), label: 'respondents', color: hue(edge.source) },
					// This strand's share of everyone who worked with the source.
					{ value: `${Math.round((edge.value / Math.max(1, edge.source.value)) * 100)}%`, label: `of ${edge.source.name} users` },
				],
			},
			event
		)
	}
</script>

<Frame {figure} {width} {height}>
	<g transform="translate(0, {PAD})">
		{#if graph.nodes.length}
			<!-- Clipped at the midpoint, or two long headings meet in the middle. -->
			{#if heads.left}
				<text y={HEAD - 12} font-size={SMALL} font-weight="600" fill={theme.muted}>
					{clip(heads.left, chars(width / 2 - PAD, SMALL))}
				</text>
			{/if}
			{#if heads.right}
				<text x={px(width)} y={HEAD - 12} text-anchor="end" font-size={SMALL} font-weight="600" fill={theme.muted}>
					{clip(heads.right, chars(width / 2 - PAD, SMALL))}
				</text>
			{/if}
		{/if}

		<defs>
			{#each graph.links as edge, i (i)}
				<linearGradient
					id="link-{uid}-{i}"
					gradientUnits="userSpaceOnUse"
					x1={px(edge.source.x1)}
					x2={px(edge.target.x0)}
					y1={px((edge.source.y0 + edge.source.y1) / 2)}
					y2={px((edge.target.y0 + edge.target.y1) / 2)}
				>
					<stop offset="0%" stop-color={hue(edge.source)} />
					<stop offset="100%" stop-color={hue(edge.target)} />
				</linearGradient>
			{/each}
		</defs>

		{#each graph.links as edge, i (i)}
			<path
				d={strand(edge)}
				stroke="url(#link-{uid}-{i})"
				stroke-width={px(Math.max(1, edge.width ?? 1))}
				fill="none"
				opacity={hover.active === null ? 0.35 : hover.active === i ? 0.85 : 0.12}
			/>
		{/each}

		<!-- Hit strokes over the lot: most strands are a pixel or two thick. -->
		{#each graph.links as edge, i (i)}
			<path
				d={strand(edge)}
				stroke="transparent"
				stroke-width={px(Math.max(HIT / 2, edge.width ?? 1))}
				fill="none"
				role="presentation"
				onpointermove={(event) => enter(i, edge, event)}
				onpointerleave={hover.leave}
				onpointercancel={hover.leave}
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
				{clip(node.name, chars(labelWidth - 8, SMALL))}
			</text>
		{/each}
	</g>
</Frame>
