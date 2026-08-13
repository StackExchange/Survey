<script lang="ts">
	// Flow between two columns of the same set. Rows are `{source, target, value}`
	// indexing the *same* `metadata.labels`, so the node set is the labels twice —
	// one column read from, one read to. As a single node set d3-sankey resolves it
	// to an eight-column DAG with names colliding into downstream nodes.
	import { sankey as layout, sankeyLinkHorizontal } from 'd3-sankey'

	import Frame from '$charts/svg/Wrap.svelte'
	import { PAD, chars, clip, count, middle, px, pxPath, series, shorten, theme } from '$charts/utils/theme'
	import { HIT, type OnHover } from '$charts/utils/tooltip'

	let { figure, width = 800, onhover }: { figure: any; width?: number; onhover?: OnHover } = $props()

	// A strand under the pointer, so the rest can drop back and let it be followed.
	let active = $state<number | null>(null)

	// One gradient per link, so they need a namespace of their own on the page.
	const uid = $props.id()

	const NODE_WIDTH = 14
	const NODE_PADDING = 12
	const ROW = 60
	const LABEL_SIZE = 14
	const HEAD_SIZE = 14
	// A band above the flow for the column headings. Text is drawn from its
	// baseline, so without this they sit off the top of the canvas.
	const HEAD = 28
	// Names sit outside the columns on both sides, so the flow gives up width at
	// each end rather than the single gutter a row chart needs.
	const LABEL_WIDTH = $derived(Math.round(width * 0.17))

	const rows = $derived((figure.data ?? []).filter(Boolean))
	const short = $derived(shorten(figure))
	const labels = $derived((figure.metadata?.labels ?? []).map(short))

	// Only the labels a column actually uses: d3-sankey pushes a node with no
	// outgoing links to the far side, where it lands in the wrong column.
	const columns = $derived.by(() => {
		const sources = new Set(rows.map((row: any) => row.source))
		const targets = new Set(rows.map((row: any) => row.target))
		const ids = labels.map((_: string, i: number) => i)
		return { left: ids.filter((i: number) => sources.has(i)), right: ids.filter((i: number) => targets.has(i)) }
	})

	const plotHeight = $derived(Math.max(200, Math.max(columns.left.length, columns.right.length) * ROW))
	const height = $derived(PAD * 2 + HEAD + plotHeight)

	const graph = $derived.by(() => {
		if (!columns.left.length || !columns.right.length) return { nodes: [], links: [] }

		const left = new Map(columns.left.map((id: number, i: number) => [id, i]))
		const right = new Map(columns.right.map((id: number, i: number) => [id, columns.left.length + i]))
		const x0 = LABEL_WIDTH

		// Generics: the bare overload types nodes as `{}` and rejects these.
		return layout<{ name: string; label: number }, { value: number }>()
			.nodeWidth(NODE_WIDTH)
			.nodePadding(NODE_PADDING)
			.extent([
				[x0, HEAD],
				[Math.max(x0 + NODE_WIDTH * 3, width - LABEL_WIDTH), HEAD + plotHeight],
			])({
			// `label` keeps the index into metadata.labels, which colours the node —
			// the same language has to read the same in both columns.
			nodes: [...columns.left, ...columns.right].map((id: number) => ({ name: labels[id], label: id })),
			links: rows.map((row: any) => ({ ...row, source: left.get(row.source), target: right.get(row.target) })),
		}) as { nodes: any[]; links: any[] }
	})

	const link = sankeyLinkHorizontal()
	// d3 hands back full float precision, and it is drawn twice.
	const strand = (edge: any) => pxPath(link(edge) ?? '')

	const hue = (node: any) => series(node.label ?? 0)

	const enter = (i: number, edge: any, event: PointerEvent) => {
		active = i
		onhover?.(
			{
				title: `${edge.source.name} → ${edge.target.name}`,
				rows: [
					{ value: count(edge.value), label: 'respondents', color: hue(edge.source) },
					// What share of everyone who worked with the source this strand is.
					{ value: `${Math.round((edge.value / Math.max(1, edge.source.value)) * 100)}%`, label: `of ${edge.source.name} users` },
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

<Frame {figure} {width} {height}>
	<g transform="translate(0, {PAD})">
		{#if graph.nodes.length}
			<!-- Baseline set clear of the flow's top edge, which starts at HEAD. -->
			<text x={LABEL_WIDTH} y={HEAD - 12} text-anchor="end" font-size={HEAD_SIZE} font-weight="600" fill={theme.muted}>Worked with</text>
			<text x={width - LABEL_WIDTH} y={HEAD - 12} font-size={HEAD_SIZE} font-weight="600" fill={theme.muted}>Wants to work with</text>
		{/if}

		<defs>
			<!-- Each link fades from its source's colour to its target's, so a strand
			     can be followed across without a legend. -->
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
				opacity={active === null ? 0.35 : active === i ? 0.85 : 0.12}
			/>
		{/each}

		<!-- Hit strokes over the lot: most strands are only a pixel or two thick, and
		     they cross, so the pointer needs a wider band and the topmost one wins. -->
		{#each graph.links as edge, i (i)}
			<path
				d={strand(edge)}
				stroke="transparent"
				stroke-width={px(Math.max(HIT / 2, edge.width ?? 1))}
				fill="none"
				role="presentation"
				onpointermove={(event) => enter(i, edge, event)}
				onpointerleave={leave}
				onpointercancel={leave}
			/>
		{/each}

		{#each graph.nodes as node, i (i)}
			{@const source = i < columns.left.length}
			<rect x={px(node.x0)} y={px(node.y0)} width={px(node.x1 - node.x0)} height={px(Math.max(1, node.y1 - node.y0))} fill={hue(node)} />

			<!-- Read from on the left, read to on the right, so each name sits on the
			     outside of its own column. -->
			<text
				x={px(source ? node.x0 - 8 : node.x1 + 8)}
				y={middle(px((node.y0 + node.y1) / 2), LABEL_SIZE)}
				text-anchor={source ? 'end' : 'start'}
				font-size={LABEL_SIZE}
				fill={theme.ink}
			>
				{clip(node.name, chars(LABEL_WIDTH - 8, LABEL_SIZE))}
			</text>
		{/each}
	</g>
</Frame>
