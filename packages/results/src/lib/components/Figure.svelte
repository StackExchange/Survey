<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'
	import type { TooltipData } from '$charts/utils/tooltip'

	import { IconLink } from '@stackoverflow/stacks-icons/icons'

	import { CHART_WIDTH } from '$charts/utils/chrome'
	import { openQuestion } from '$lib/panel'
	import { ofSurvey, respondents } from '$lib/table'

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

	// An export's file is always light, so on a dark page the preview has to say so.
	const light = $derived(chrome.brand ? 'chart-light' : '')

	const Chart = $derived(charts[block.chart as keyof typeof charts])

	let hovered = $state<{ data: TooltipData | null; event?: PointerEvent }>({ data: null })

	let measured = $state(0)
	const drawn = $derived(width ?? (measured || CHART_WIDTH))

	const fits = $derived(width ? 'overflow-x-auto' : '')
	const floor = $derived(width ? '[&>svg]:min-w-160' : '')

	const scales = $derived(width ? '[&>svg]:h-auto' : '')

	const n = $derived(block.demographic?.n)
	const share = $derived(ofSurvey(block.demographic?.share))

	const caption = $derived(
		[block.demographic?.name, n != null && `n = ${respondents(n)}`, share && `${share} of respondents`, block.subtext]
			.filter(Boolean)
			.join(' · ')
	)
</script>

<figure class="relative flex h-full flex-col">
	<div class="grow bg-black-150 dark:bg-black-500 {fits}">
		<div bind:clientWidth={measured} class="[&>svg]:w-full {scales} {floor} {light}">
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
			<p class="absolute right-0 bottom-0 flex gap-4 bg-black-150 dark:bg-black-500">
				<a {href} onclick={open} class="px-4 pt-4 pb-4 ml-auto flex items-center gap-1.5 hover:bg-black hover:text-white" aria-label="Permalink: {block.demographic.name}">
					Share or cite
					<Icon src={IconLink} />
				</a>
			</p>
		{/if}
	</figcaption>
</figure>
