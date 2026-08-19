<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'
	import type { TooltipData } from '$charts/utils/tooltip'

	import { IconShare } from '@stackoverflow/stacks-icons/icons'

	import { CHART_WIDTH } from '$charts/utils/chrome'
	import { openQuestion } from '$lib/panel'

	import { charts } from '$charts'
	import ChartRoot from '$charts/ChartRoot.svelte'
	import Tooltip from '$charts/Tooltip.svelte'

	import Icon from './Icon.svelte'

	// `width` fixes the layout, given only where the drawing has to be the file
	// byte for byte. Everywhere else the chart follows its container.
	let { block, href, chrome = {}, width }: { block: any; href?: string; chrome?: Chrome; width?: number } = $props()

	const open = (event: MouseEvent) => href && openQuestion(event, href)

	// An export's file is always light, so on a dark page the preview has to say so.
	const light = $derived(chrome.brand ? 'chart-light' : '')

	const Chart = $derived(charts[block.chart as keyof typeof charts])

	let hovered = $state<{ data: TooltipData | null; event?: PointerEvent }>({ data: null })

	// Only read when no width was given, so a fixed drawing never re-lays out.
	let measured = $state(0)
	const drawn = $derived(width ?? (measured || CHART_WIDTH))

	// A fixed drawing scrolls below its floor rather than shrinking its labels.
	const fits = $derived(width ? 'overflow-x-auto' : '')
	const floor = $derived(width ? '[&>svg]:min-w-160' : '')

	// A responsive chart re-lays out rather than scaling, so its height is its own
	// and `h-auto` would derive it from the pre-measure width — a page that reflows
	// the moment the real one arrives. A fixed drawing is a preview of a file, and
	// does scale.
	const scales = $derived(width ? '[&>svg]:h-auto' : '')
</script>

<figure class="relative flex h-full flex-col">
	<div class="grow bg-black-150 pb-3 dark:bg-black-500 {fits}">
		<div bind:clientWidth={measured} class="[&>svg]:w-full {scales} {floor} {light}">
			{#if Chart}
				<ChartRoot chart={Chart} figure={block} width={drawn} {chrome} onhover={(data, event) => (hovered = { data, event })} />
			{/if}
		</div>
	</div>

	<Tooltip data={hovered.data} event={hovered.event} />

	<figcaption class="mt-auto text-sm">
		<!-- The sample size, share and subtext are drawn inside the chart, so they
		     leave with it. Only the link is left out here. -->
		{#if href}
			<p class="absolute right-0 bottom-0 flex gap-4 bg-black-150 px-4 pb-4 dark:bg-black-500">
				<a {href} onclick={open} class="ml-auto flex items-center gap-1.5 hover:underline" aria-label="Permalink: {block.demographic.name}">
					Share
					<Icon src={IconShare} />
				</a>
			</p>
		{/if}
	</figcaption>
</figure>
