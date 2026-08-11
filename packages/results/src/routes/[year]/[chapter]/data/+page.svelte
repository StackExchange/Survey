<script lang="ts">
	import { resolve } from '$app/paths'
	import ChapterNextPrev from '$lib/components/ChapterNextPrev.svelte'
	import ChapterHeader from '$lib/components/ChapterHeader.svelte'
	import Figure from '$lib/components/Figure.svelte'
	import CopyPage from '$lib/components/CopyPage.svelte'
	import NavToggle from '$lib/components/NavToggle.svelte'
	import Demographics, { tabId } from '$lib/components/Demographics.svelte'
	import WhatWeAsked from '$lib/components/WhatWeAsked.svelte'
	import { graph, JsonLd, Seo } from '$lib/seo'
	import Markdown from '$lib/components/Markdown.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { IconArrowDownRight, IconArrowRight, IconQuestion } from '@stackoverflow/stacks-icons/icons'
	import { SpotMetrics } from '@stackoverflow/stacks-icons/spots'

	let { data, params } = $props()

	// Chosen group per figure, keyed by figure id — there are up to 28 on a page.
	let chosen = $state<Record<string, string>>({})

	function choose(block: any, id: string) {
		chosen[block.id] = id
	}

	// Spread over the figure, so Figure and DataTable see the server's shape.
	function current(block: any) {
		const group = (block.demographics ?? []).find((d: any) => d.demographic.id === chosen[block.id])
		return group ? { ...block, ...group } : block
	}

	// Left off for the default group, whose bare URL is the canonical one.
	function permalink(block: any) {
		const path = resolve('/[year]/[chapter]/data/[question]', { year: data.year, chapter: data.chapter.id, question: block.id })
		const id = chosen[block.id]
		return id && id !== (block.demographics ?? [])[0]?.demographic.id ? `${path}?d=${id}` : path
	}

	const year = $derived(data.year)
	const path = $derived(`/${year}/${data.chapter.id}/data`)
	const questions = $derived(data.chapter.sections.flatMap((s: any) => s.questions.filter((q: any) => q.kind === 'figure')))
	const description = $derived(`Every figure in the ${data.chapter.name} chapter, with sample sizes.`)

	const nodes = $derived([
		graph.organization(),
		graph.website(),
		graph.webPage(
			{
				path,
				title: `${data.chapter.name} data ${year}`,
				description,
				markdown: `${path}.md`,
			},
			graph.ids.dataset(path)
		),
		graph.breadcrumbs([
			{ name: 'Developer Survey', path: '/' },
			{ name: year, path: `/${year}` },
			{ name: data.chapter.name, path: `/${year}/${data.chapter.id}` },
			{ name: 'Data', path },
		]),
		graph.chapterDataset(year, data.chapter, questions),
	])
</script>

<Seo title="{data.chapter.name} data {data.year}" {description} />
<JsonLd graph={nodes} />

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
	<div class="flex justify-between items-center mt-8 mb-25 container mx-auto">
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
					<h2 id={section.id} class="font-headline text-2xl inline-flex items-center -mb-px">
						<span class="bg-black text-white py-1 px-3 inline-block">{data.chapter.index}.{sectionIndex + 1}</span>
						<span class="py-1 px-3 inline-block bg-black-150 dark:bg-black-500">{section.name}</span>
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
						: ''} border-black-200 dark:border-black-500 py-20 overflow-x-clip"
				>
					<div class="container flex flex-col lg:flex-row gap-6 items-stretch">
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<header tabindex="0" class="basis-1/4 flex flex-col lg:sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
							<h3 id={titleId} class="mt-3 mb-3 font-headline text-3xl leading-8">
								<a
									class="group"
									href={resolve('/[year]/[chapter]/data/[question]', { year: data.year, chapter: data.chapter.id, question: block.id })}
								>
									{block.name} <span class="inline-flex p-1 ml-0.5 aspect-square group-hover:bg-orange"><Icon src={IconArrowRight} /></span>
								</a>
							</h3>

							{#if block.description}
								<Markdown content={block.description} class="text-black-400 dark:text-black-300" />
							{/if}

							{#if shown.definition}
								{@const definition = shown.definition}

								<div class="mt-auto pt-6 relative">
									<h4 class="w-fit flex items-center bg-blue-extra-light dark:bg-blue-dark px-4 pt-2 gap-2">
										<Icon src={IconQuestion} />
										What we asked
									</h4>
									<WhatWeAsked {definition} name={block.name} />
								</div>
							{/if}
						</header>

						<div class="basis-3/4 shrink min-w-0 flex flex-col">
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
								class="grow flex flex-col"
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
		class="max-w-4xs bg-black hover:bg-orange-medium fixed right-5 bottom-5 flex leading-snug z-50"
	>
		<Icon src={SpotMetrics} class="native max-w-30 h-auto p-3" />
		<div class="p-3 pl-0">
			<div class="text-white font-medium">Back to highlights</div>
			<div class="text-black-350">Get the big picture</div>
			<div class="text-black bg-orange self-end mt-auto p-2 absolute right-0 bottom-0"><Icon src={IconArrowDownRight} /></div>
		</div>
	</a>
</main>
