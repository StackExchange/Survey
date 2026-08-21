<script lang="ts">
	import { IconArrowRight, IconQuestion } from '@stackoverflow/stacks-icons/icons'
	import { SpotMetrics } from '@stackoverflow/stacks-icons/spots'

	import { resolve } from '$app/paths'

	import ButtonToggle from '$components/ButtonToggle.svelte'
	import ChapterHeader from '$components/ChapterHeader.svelte'
	import ChapterJump from '$components/ChapterJump.svelte'
	import ChapterNextPrev from '$components/ChapterNextPrev.svelte'
	import CopyPage from '$components/CopyPage.svelte'
	import Figure from '$components/Figure.svelte'
	import Icon from '$components/Icon.svelte'
	import QuestionSurvey from '$components/QuestionSurvey.svelte'
	import QuestionTabs, { tabId } from '$components/QuestionTabs.svelte'
	import Seo from '$components/Seo.svelte'

	let { data, params } = $props()

	let chosen = $state<Record<string, string>>({})

	function choose(block: any, id: string) {
		chosen[block.id] = id
	}

	function current(block: any) {
		const groups = block.demographics ?? []
		const group = groups.find((d: any) => d.demographic.id === chosen[block.id]) ?? groups[0] // first is default
		return group ? { ...block, ...group } : block
	}

	function permalink(block: any) {
		const path = resolve('/[year]/[chapter]/data/[question]', { year: data.year, chapter: data.chapter.id, question: block.id })
		const id = chosen[block.id]
		return id && id !== (block.demographics ?? [])[0]?.demographic.id ? `${path}?d=${id}` : path
	}

	const description = $derived(`Every figure in the ${data.chapter.name} chapter, with sample sizes.`)
</script>

<Seo title="{data.chapter.name} data {data.year}" {description} graph={data.chapter.jsonld} />

<ChapterHeader year={data.year} chapter={data.chapter} variant="data" section="Data">
	<nav aria-label="Chapter sections" class="mt-10">
		<ul>
			{#each data.chapter.sections as section, sectionIndex (section.id)}
				<li>
					<a href={`#${section.id}`} class="mt-3 flex gap-3 text-xl leading-tight lg:items-center">
						<span>{data.chapter.index}.{sectionIndex + 1}.</span>
						{section.name}
						<Icon src={IconArrowRight} class="ml-auto self-center md:ml-0" />
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</ChapterHeader>

<main id="main" tabindex="-1">
	<div class="container mx-auto mt-8 mb-25 flex items-center justify-between">
		<ButtonToggle
			options={[
				{ href: resolve('/[year]/[chapter]', { year: params.year, chapter: params.chapter }), label: 'Overview' },
				{ href: resolve('/[year]/[chapter]/data', { year: params.year, chapter: params.chapter }), label: 'Full data' },
			]}
		/>
		<CopyPage title="the {data.chapter.name} chapter full data" />
	</div>

	{#each data.chapter.sections as section, sectionIndex (section.id)}
		<section aria-labelledby={section.id}>
			<header class="bg-grid border-b border-b-black-200 py-5 dark:border-b-black-500">
				<div class="container mx-auto">
					<h2 id={section.id} class="-mb-px inline-flex flex-col items-start font-headline text-2xl lg:flex-row lg:items-center">
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
									<h4 class="flex w-fit items-center gap-2 bg-blue-extra-light px-4 pt-2 dark:bg-blue-light dark:text-black">
										<Icon src={IconQuestion} />
										Question
									</h4>
									<QuestionSurvey {definition} name={block.name} />
								</div>
							{/if}
						</header>

						<div class="flex min-w-0 shrink basis-3/4 flex-col">
							<QuestionTabs
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
								<Figure block={shown} href={permalink(block)} table />
							</div>
						</div>
					</div>
				</article>
			{/each}
		</section>
	{/each}

	<ChapterJump
		href={resolve('/[year]/[chapter]', { year: params.year, chapter: params.chapter })}
		spot={SpotMetrics}
		title="See the {data.chapter.name} highlights"
		subtitle="Get the big picture"
		direction="back"
	/>
</main>

<ChapterNextPrev year={data.year} previous={data.chapter.previous} next={data.chapter.next} />
