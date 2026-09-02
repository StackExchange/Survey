<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'
	import type { TooltipData } from '$charts/utils/theme'

	import { IconLink } from '@stackoverflow/stacks-icons/icons'

	import { CHART_WIDTH } from '$charts/utils/chrome'
	import { captionText } from '$charts/utils/expressive'
	import { openQuestion } from '$lib/panel'

	import { charts } from '$charts'
	import ChartRoot from '$charts/ChartRoot.svelte'
	import DataTable from '$charts/text/DataTable.svelte'
	import Tooltip from '$charts/Tooltip.svelte'

	import Icon from './Icon.svelte'

	let {
		block,
		href,
		chrome = {},
		width,
		table = false,
	}: { block: any; href?: string; chrome?: Chrome; width?: number; table?: boolean } = $props()

	const open = (event: MouseEvent) => href && openQuestion(event, href)

	const Chart = $derived(charts[block.chart as keyof typeof charts])

	let hovered = $state<{ data: TooltipData | null; event?: PointerEvent }>({ data: null })

	let measured = $state(0)
	const drawn = $derived(width ?? (measured || CHART_WIDTH))

	const fits = $derived(width ? 'overflow-x-auto' : '')
	const floor = $derived(width ? '[&>svg]:min-w-160' : '')

	const scales = $derived(width ? '[&>svg]:h-auto' : '')

	const caption = $derived(captionText(block))
</script>

<figure class="relative flex h-full flex-col">
	<div class="chart-ground grow bg-black-150 dark:bg-black-500 {fits}">
		<div bind:clientWidth={measured} data-ready={width || measured ? '' : undefined} class="chart-reveal [&>svg]:w-full {scales} {floor}">
			{#if Chart}
				<ChartRoot chart={Chart} figure={block} width={drawn} {chrome} onhover={(data, event) => (hovered = { data, event })} />
			{/if}
		</div>
	</div>

	{#if table}
		<!-- Make the chart accessible -->
		<div class="sr-only">
			<DataTable figure={block} />
		</div>
	{/if}

	<Tooltip data={hovered.data} event={hovered.event} />

	<figcaption class="mt-auto text-sm">
		<span class="sr-only">{caption}</span>

		{#if href}
			<a
				{href}
				onclick={open}
				class="absolute right-0 top-full ml-auto flex items-center gap-1.5 px-3 py-2.5 hover:bg-black hover:text-white"
				aria-label="Permalink: {block.demographic.name}"
			>
				View and share
				<Icon src={IconLink} />
			</a>
		{/if}
	</figcaption>
</figure>
