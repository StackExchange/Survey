<script lang="ts">
	import { resolve } from '$app/paths'
	import ChapterNextPrev from '$lib/components/ChapterNextPrev.svelte'
	import ChapterHeader from '$lib/components/ChapterHeader.svelte'
	import Figure from '$lib/components/Figure.svelte'
	import CopyPage from '$lib/components/CopyPage.svelte'
	import NavToggle from '$lib/components/NavToggle.svelte'
	import Demographics, { tabId } from '$lib/components/Demographics.svelte'
	import WhatWeAsked from '$lib/components/WhatWeAsked.svelte'
	import Seo from '$lib/components/Seo.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { IconArrowDownRight, IconArrowRight, IconQuestion } from '@stackoverflow/stacks-icons/icons'
	import { SpotMetrics } from '@stackoverflow/stacks-icons/spots'

	let { data, params } = $props()

	// Chosen group per figure, keyed by figure id — there are up to 28 on a page.
	let chosen = $state<Record<string, string>>({})

	function choose(block: any, id: string) {
		chosen[block.id] = id
	}

	// Spread over the figure, so Figure and DataTable see one flat shape. The
	// payload carries the cuts and nothing flat, so the first is the default.
	function current(block: any) {
		const groups = block.demographics ?? []
		const group = groups.find((d: any) => d.demographic.id === chosen[block.id]) ?? groups[0]
		return group ? { ...block, ...group } : block
	}

	// Left off for the default group, whose bare URL is the canonical one.
	function permalink(block: any) {
		const path = resolve('/[year]/[chapter]/data/[question]', { year: data.year, chapter: data.chapter.id, question: block.id })
		const id = chosen[block.id]
		return id && id !== (block.demographics ?? [])[0]?.demographic.id ? `${path}?d=${id}` : path
	}

	const description = $derived(`Every figure in the ${data.chapter.name} chapter, with sample sizes.`)
</script>

<Seo title="{data.chapter.name} data {data.year}" {description} graph={data.chapter.jsonld} />

<ChapterHeader year={data.year} chapter={data.chapter} variant="data" section="Survey data">
	<nav aria-label="Chapter sections" class="mt-10">
		<ul>
			{#each data.chapter.sections as section, sectionIndex (section.id)}
				<li>
					<a href={`#${section.id}`} class="flex items-center gap-3 text-xl">
						<span>{data.chapter.index}.{sectionIndex + 1}.</span>
						{section.name}
						<Icon src={IconArrowRight} />
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</ChapterHeader>

<main id="main" tabindex="-1">
	<div class="container mx-auto mt-8 mb-25 flex items-center justify-between">
		<NavToggle
			options={[
				{ href: resolve('/[year]/[chapter]', { year: params.year, chapter: params.chapter }), label: 'Overview' },
				{ href: resolve('/[year]/[chapter]/data', { year: params.year, chapter: params.chapter }), label: 'Full data' },
			]}
		/>
		<CopyPage title="the {data.chapter.name} chapter full data" />
	</div>

	{#each data.chapter.sections as section, sectionIndex (section.id)}
		<section aria-labelledby={section.id}>
			<header class="bg-grid border-b border-b-black-200 dark:border-b-black-500">
				<div class="container mx-auto">
					<h2 id={section.id} class="-mb-px inline-flex items-center font-headline text-2xl">
						<span class="inline-block bg-black px-3 py-1 text-white">{data.chapter.index}.{sectionIndex + 1}</span>
						<span class="inline-block bg-black-150 px-3 py-1 dark:bg-black-500">{section.name}</span>
					</h2>
				</div>
			</header>

			{#each section.questions as block, blockIndex (block.id)}
				{@const groups = block.demographics ?? []}
				{@const shown = current(block)}
				{@const panelId = `panel-${block.id}`}
				{@const titleId = `${block.id}-title`}

				<article
					id={block.id}
					aria-labelledby={titleId}
					class="{blockIndex + 1 !== section.questions.length
						? 'border-b'
						: ''} overflow-x-clip border-black-200 py-20 dark:border-black-500"
				>
					<div class="container flex flex-col items-stretch gap-6 lg:flex-row">
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<header tabindex="0" class="top-16 flex max-h-[calc(100vh-4rem)] basis-1/4 flex-col overflow-y-auto lg:sticky">
							<h3 id={titleId} class="mt-3 mb-3 font-headline text-3xl leading-8">
								<a
									class="group"
									href={resolve('/[year]/[chapter]/data/[question]', { year: data.year, chapter: data.chapter.id, question: block.id })}
								>
									{block.name} <span class="ml-0.5 inline-flex aspect-square p-1 group-hover:bg-orange"><Icon src={IconArrowRight} /></span>
								</a>
							</h3>

							{#if block.description}
								<div class="md text-black-400 dark:text-black-300">{@html block.descriptionHtml}</div>
							{/if}

							{#if shown.definition}
								{@const definition = shown.definition}

								<div class="relative mt-auto pt-6">
									<h4 class="flex w-fit items-center gap-2 bg-blue-extra-light px-4 pt-2 dark:bg-blue-dark">
										<Icon src={IconQuestion} />
										What we asked
									</h4>
									<WhatWeAsked {definition} name={block.name} />
								</div>
							{/if}
						</header>

						<div class="flex min-w-0 shrink basis-3/4 flex-col">
							<Demographics
								demographics={groups}
								selected={shown.demographic.id}
								label="Respondent group for {block.name}"
								{panelId}
								onselect={(id) => choose(block, id)}
							/>

							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<div
								id={panelId}
								class="flex grow flex-col"
								role={groups.length > 1 ? 'tabpanel' : undefined}
								aria-labelledby={groups.length > 1 ? tabId(panelId, shown.demographic.id) : undefined}
								tabindex={groups.length > 1 ? 0 : undefined}
							>
								<Figure block={shown} href={permalink(block)} />
							</div>
						</div>
					</div>
				</article>
			{/each}
		</section>
	{/each}

	<ChapterNextPrev year={data.year} previous={data.chapter.previous} next={data.chapter.next} />

	<a
		href={resolve('/[year]/[chapter]', { year: params.year, chapter: params.chapter })}
		class="max-w-4xs fixed right-5 bottom-5 z-50 flex bg-black leading-snug hover:bg-orange-medium"
	>
		<Icon src={SpotMetrics} class="native h-auto max-w-30 p-3" />
		<div class="p-3 pl-0">
			<div class="font-medium text-white">Back to highlights</div>
			<div class="text-black-350">Get the big picture</div>
			<div class="absolute right-0 bottom-0 mt-auto self-end bg-orange p-2 text-black"><Icon src={IconArrowDownRight} /></div>
		</div>
	</a>
</main>
