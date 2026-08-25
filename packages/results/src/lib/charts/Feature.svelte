<script lang="ts">
	import type { TooltipData } from '$charts/utils/tooltip'
	import type { Snippet } from 'svelte'

	import { IconArrowRight } from '@stackoverflow/stacks-icons/icons'

	import { dev } from '$app/environment'
	import { resolve } from '$app/paths'

	import { openQuestion } from '$lib/panel'

	import ChapterHeader from '$components/ChapterHeader.svelte'
	import Icon from '$components/Icon.svelte'

	import { charts } from '$charts'
	import DataTable from '$charts/text/DataTable.svelte'
	import Tooltip from '$charts/Tooltip.svelte'

	let {
		block,
		tier = 'highlight',
		year,
		chapter,
		flip = false,
		children,
	}: {
		block: any
		tier?: 'hero' | 'highlight'
		year?: string
		chapter?: any
		flip?: boolean
		children?: Snippet
	} = $props()

	const Chart = $derived(charts[block.chart as keyof typeof charts])

	let hovered = $state<{ data: TooltipData | null; event?: PointerEvent }>({ data: null })

	let measured = $state(0)
	const width = $derived(measured || 800)
</script>

<div class="group items-start justify-center gap-15 md:grid md:grid-cols-10 {tier === 'hero' ? 'py-10' : ''}">
	<div class="col-span-5 {flip ? '' : 'md:order-last'}">
		{#if children}
			{@render children()}
		{:else if tier === 'hero' && year && chapter}
			<ChapterHeader {year} {chapter} variant="hero" section={block.section}>
				<div class="bg-white p-5 dark:bg-black-500">
					<h4 class="font-headline text-3xl font-normal">{block.headline}</h4>
					{#if block.description}
						<div class="md mt-3 text-base text-black-400 dark:text-black-300">{@html block.descriptionHtml}</div>
					{/if}
				</div>

				<a
					class="flex w-fit items-center gap-2 self-end bg-black-150 px-5 py-3 hover:bg-orange dark:bg-black-500 dark:hover:bg-orange dark:hover:text-black"
					href={resolve('/[year]/[chapter]/data/[question]', { year, chapter: chapter.id, question: block.slug })}
					onclick={(event) =>
						openQuestion(event, resolve('/[year]/[chapter]/data/[question]', { year, chapter: chapter.id, question: block.slug }))}
				>
					Dig deeper
					<Icon src={IconArrowRight} />
				</a>
			</ChapterHeader>
		{:else}
			<h3 class="font-headline text-4xl font-normal">{block.headline}</h3>
			{#if block.description}
				<div class="md mt-4 text-base text-black-400 dark:text-black-300">{@html block.descriptionHtml}</div>
			{/if}
		{/if}

		{#if dev}
			<aside class="group-hover:block hidden mt-5 font-mono text-xs">DEV: {block.chart} / {block.dataId}</aside>
		{/if}
	</div>

	<figure bind:clientWidth={measured} class="col-span-5 [&>svg]:h-auto [&>svg]:w-full">
		<Chart figure={block} {width} onhover={(data, event) => (hovered = { data, event })} />

		<Tooltip data={hovered.data} event={hovered.event} />

		<div class="sr-only">
			<DataTable figure={block} />
		</div>
	</figure>
</div>
