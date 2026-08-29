<script lang="ts">
	import type { TooltipData } from '$charts/utils/theme'
	import type { Snippet } from 'svelte'

	import { IconArrowRight, IconLink } from '@stackoverflow/stacks-icons/icons'

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
		responsiveChart = true,
		children,
	}: {
		block: any
		tier?: 'hero' | 'highlight'
		year?: string
		chapter?: any
		flip?: boolean
		responsiveChart?: boolean
		children?: Snippet
	} = $props()

	const Chart = $derived(charts[block.chart as keyof typeof charts])

	const inData = $derived(
		year && chapter && block.sectionId ? `${resolve('/[year]/[chapter]/data', { year, chapter: chapter.id })}#${block.sectionId}` : null
	)
	const question = $derived(
		year && chapter && block.slug ? resolve('/[year]/[chapter]/data/[question]', { year, chapter: chapter.id, question: block.slug }) : null
	)

	let hovered = $state<{ data: TooltipData | null; event?: PointerEvent }>({ data: null })

	let measured = $state(0)

	const chartWidth = $derived(responsiveChart ? measured || 590 : 700)
</script>

<div class="group justify-center gap-15 md:grid md:grid-cols-10 {tier === 'hero' ? 'items-center py-10' : 'pb-6 lg:pb-0'}">
	<div class="{tier === 'hero' ? 'col-span-4' : 'col-span-5'} {flip ? '' : 'md:order-last'}">
		{#if children}
			{@render children()}
		{:else if tier === 'hero' && year && chapter}
			<ChapterHeader {year} {chapter} variant="hero" section={block.section}>
				<div class="bg-(--panel)">
					<div class="p-5">
						<h4 class="font-headline text-3xl font-normal">
							{block.headline}
						</h4>
						{#if block.description}
							<div class="md mt-3 text-base text-black-400 dark:text-black-300">{@html block.descriptionHtml}</div>
						{/if}
					</div>

					<a
						class="ml-auto flex w-fit items-center gap-2 self-end bg-black-150 px-4 py-2 hover:bg-black hover:text-white dark:bg-black-400 dark:hover:bg-orange dark:hover:text-black"
						href={resolve('/[year]/[chapter]/data/[question]', { year, chapter: chapter.id, question: block.slug })}
						onclick={(event) =>
							openQuestion(event, resolve('/[year]/[chapter]/data/[question]', { year, chapter: chapter.id, question: block.slug }))}
					>
						Dig deeper
						<Icon src={IconArrowRight} />
					</a>
				</div>
			</ChapterHeader>
		{:else}
			<p class="mb-4 flex items-center gap-2 text-sm text-black-400 dark:text-black-300">
				<span aria-hidden="true" class="inline-block h-3 w-3 shrink-0" style="background: var(--chapter-primary, var(--color-orange))"
				></span>
				{#if inData}
					<a class="hover:underline" href={inData}>{block.section}</a>
				{:else}
					{block.section ?? ''}
				{/if}
			</p>

			<h3 class="font-headline text-3xl font-normal md:text-4xl">{block.headline}</h3>

			{#if block.description}
				<div class="md mt-4 text-base text-black-400 dark:text-black-300">{@html block.descriptionHtml}</div>
			{/if}

			{#if question}
				<a
					href={question}
					onclick={(event) => openQuestion(event, question)}
					class="absolute right-3 bottom-3 inline-flex items-center gap-1.5 px-3 py-2 text-sm hover:bg-black hover:text-white dark:hover:bg-black-500"
					aria-label="Permalink: {block.headline}"
				>
					Share or cite
					<Icon src={IconLink} />
				</a>
			{/if}
		{/if}

		{#if dev}
			<div class="mt-5 font-mono text-xs">DEV: {block.chart} / {block.dataId}</div>
		{/if}
	</div>

	<figure
		bind:clientWidth={measured}
		data-ready={measured ? '' : undefined}
		class="chart-reveal {tier === 'hero' ? 'col-span-6' : 'col-span-5'} mt-10 touch-pan-y lg:mt-0 [&>svg]:h-auto [&>svg]:w-full"
	>
		<Chart figure={block} width={chartWidth} onhover={(data, event) => (hovered = { data, event })} />

		<Tooltip data={hovered.data} event={hovered.event} />

		<figcaption class="sr-only">
			<DataTable figure={block} />
		</figcaption>
	</figure>
</div>
