<script lang="ts">
	import type { PageData } from './$types'

	import { IconArrowLeft, IconArrowRight, IconQuestion, IconTrendUp } from '@stackoverflow/stacks-icons/icons'

	import { dev } from '$app/environment'
	import { replaceState } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'

	import { githubRepo, siteUrl, surveyPreview } from '$config'

	import Button from '$components/Button.svelte'
	import ChapterHeader from '$components/ChapterHeader.svelte'
	import CopyPage from '$components/CopyPage.svelte'
	import Figure from '$components/Figure.svelte'
	import Icon from '$components/Icon.svelte'
	import QuestionData from '$components/QuestionData.svelte'
	import { askedFacts } from '$components/QuestionSurvey.svelte'
	import QuestionTabs, { tabId } from '$components/QuestionTabs.svelte'
	import Seo from '$components/Seo.svelte'
	import Share from '$components/Share.svelte'

	import ChartDownload from '$charts/ChartDownload.svelte'
	import DataTable from '$charts/text/DataTable.svelte'

	// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages -- QuestionPanel instantiates this itself; the router only ever passes `data`
	let { data, panel = false }: { data: PageData; panel?: boolean } = $props()

	let chosen = $state<{ question: string; id: string } | null>(null)
	const figure = $derived({ ...data.question, ...current })
	const definition = $derived(figure.definition)
	const demographics = $derived(data.question.demographics)
	const fallback = $derived(demographics[0])

	const current = $derived(
		(chosen?.question === data.question.id && demographics.find((d: any) => d.demographic.id === chosen?.id)) || fallback
	)

	const isFallback = $derived(current.demographic.id === fallback.demographic.id)

	// `page.url.searchParams` throws during prerendering, so `?d=` waits.
	$effect(() => {
		const question = data.question.id
		const wanted = new URLSearchParams(location.search).get('d')
		chosen = wanted && demographics.some((d: any) => d.demographic.id === wanted) ? { question, id: wanted } : null
	})

	function choose(id: string) {
		chosen = { question: data.question.id, id }
		// replaceState, not pushState: back still means the previous page, and the canonical stays clean.
		replaceState(id === fallback.demographic.id ? location.pathname : `${location.pathname}?d=${id}`, page.state)
	}

	const optionLabel = (option: any) => (typeof option === 'string' ? option : option.label)
	const optionFreeText = (option: any) => typeof option !== 'string' && Boolean(option.text_entry)

	const askedSource = (definition: any) => `${githubRepo}/blob/main/${definition.source}`
	const askedInContext = (definition: any) => `${surveyPreview}/#q-${definition.id}`
	const dataPath = $derived(resolve('/[year]/[chapter]/data', { year: data.year, chapter: data.chapter.id }))
	const chapterPath = $derived(resolve('/[year]/[chapter]', { year: data.year, chapter: data.chapter.id }))

	// Absolute, and carrying `?d=`, so a shared link opens on the group that was on screen.
	const shareUrl = $derived(
		`${siteUrl}/${data.year}/${data.chapter.id}/data/${data.question.id}${isFallback ? '' : `?d=${current.demographic.id}`}`
	)

	// Says which group it holds; demographic ids arrive kebab-cased from `scripts/data.js`.
	const exportName = $derived(
		`stackoverflow-dev-survey-${data.year}-${data.chapter.id}-${data.question.id}${isFallback ? '' : `-${current.demographic.id}`}`
	)
</script>

{#if !panel}
	<Seo title="{data.question.name} — {data.chapter.name} data {data.year}" description={data.question.description} graph={data.jsonld} />
{/if}

<div class="mb-10">
	<ChapterHeader year={data.year} chapter={data.chapter} variant="question">
		<nav aria-label="Breadcrumb" class="justify-between gap-5 lg:flex">
			<ol
				class="flex flex-wrap items-end font-headline text-xl [&_a]:block [&_a]:px-2 [&_a]:py-1 [&_a]:hover:bg-black-500 [&_a]:hover:text-white"
			>
				<li>
					<a href={chapterPath} class="bg-black-500 text-white">{data.chapter.name}</a>
				</li>
				<li>
					<a href={dataPath} class="bg-black text-white dark:bg-white dark:text-black">Data</a>
				</li>
				{#if data.question.sectionName}
					<li>
						<a href="{dataPath}#{data.question.sectionId}" class="bg-white dark:bg-black dark:text-white">
							<span class="tabular-nums">{data.chapter.index}.{data.question.sectionNumber}.</span>
							{data.question.sectionName}
						</a>
					</li>
				{/if}
			</ol>
		</nav>
	</ChapterHeader>
</div>

<svelte:element this={panel ? 'div' : 'main'} id={panel ? undefined : 'main'} tabindex={panel ? undefined : -1}>
	<div class="mx-auto mb-10 max-w-300 px-6">
		<header class="mb-10 items-start justify-between gap-10 lg:flex">
			<div>
				<h1 class="sr-only">
					{data.question.name}
				</h1>
				{#if data.question.description}
					<h2 id="analysis" class="sr-only">Our analysis</h2>
					<div aria-labelledby="analysis" class="mb-8 flex max-w-prose text-lg lg:mb-0">
						<span class="mt-px inline-block pr-3 text-7xl" aria-hidden="true">“</span>
						{@html data.question.description}
					</div>
				{/if}
			</div>

			<div class="flex shrink-0 flex-wrap gap-3 sm:gap-4">
				<Share url={shareUrl} title="{data.question.name} — Stack Overflow Developer Survey {data.year}" compact={false} />
				<CopyPage title="the question &quot;{data.question.name}&quot;" compact={false} />
			</div>
		</header>

		{#if demographics.length > 1}
			<div class="border-b border-black-150 dark:border-black-500">
				<QuestionTabs {demographics} selected={current.demographic.id} panelId="figure" onselect={choose} />
			</div>
		{/if}

		<ChartDownload {figure} name={exportName} year={data.year} url={shareUrl}>
			{#snippet chart({ block, chrome }: any)}
				<!-- The panel holds no focusable content as it’s an SVG -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					id="figure"
					role={demographics.length > 1 ? 'tabpanel' : undefined}
					tabindex={demographics.length > 1 ? 0 : undefined}
					aria-labelledby={demographics.length > 1 ? tabId('figure', current.demographic.id) : undefined}
				>
					<Figure {block} {chrome} />
				</div>
			{/snippet}
		</ChartDownload>
	</div>

	<div class="border-t border-black-200 py-10">
		<section class="mx-auto max-w-300 px-6" id="data">
			<h2 id="asked" class="mb-4 inline-flex items-center gap-2 bg-black-100 pr-2 dark:bg-transparent">
				<span class="bg-blue-light p-1.5"><Icon src={IconQuestion} class="native shrink-0" /></span>
				Question
			</h2>

			{#if definition}
				<div aria-labelledby="asked" class="mb-4 flex max-w-3xl justify-between font-headline text-2xl">
					{@html definition.titleHtml}
				</div>

				<ul class="mt-4 flex flex-wrap text-sm text-black-400 dark:text-black-300">
					{#each askedFacts(definition) as fact (fact)}
						<li class="not-first:before:mx-2 not-first:before:content-['\25aa']">{fact}</li>
					{/each}
				</ul>
			{/if}

			<div class="-mx-2 my-8"><DataTable {figure} /></div>

			<div class="flex flex-col gap-6 sm:flex-row sm:justify-between sm:gap-8">
				{#if definition?.options?.length}
					<details>
						<summary class="w-fit cursor-pointer text-sm">
							{definition.options.length} options offered<span class="sr-only">: {data.question.name}</span>
						</summary>
						<ol class="mt-3 max-h-120 list-decimal gap-x-10 overflow-y-auto pl-5 text-sm md:columns-2">
							{#each definition.options as option, i (i)}
								<li class="break-inside-avoid">
									{optionLabel(option)}{#if optionFreeText(option)}
										<span class="text-black-400 dark:text-black-300">(with free-text entry)</span>{/if}
								</li>
							{/each}
						</ol>
					</details>
				{/if}

				{#if definition}
					<p class="flex flex-wrap gap-x-6 gap-y-1 text-sm">
						<Button variant="link" href={askedInContext(definition)} label="View in survey" iconEnd={IconArrowRight} />
						{#if definition.source}
							<Button variant="link" href={askedSource(definition)} label="Question definition (.yaml)" iconEnd={IconArrowRight} />
						{/if}
					</p>
				{/if}
			</div>
		</section>
	</div>

	<div class="border-t border-black-200 py-10">
		<section class="mx-auto max-w-300 px-6" aria-labelledby="export">
			<h2 class="mb-4 inline-flex items-center gap-2 bg-black-100 pr-2 dark:bg-transparent">
				<span class="bg-blue-light p-1.5"><Icon src={IconTrendUp} class="native" /></span>
				Use this data
			</h2>

			{#if figure.series?.length}
				<p class="mb-4 text-sm text-black-400 dark:text-black-300">
					The Markdown table shows one column per segment; the CSV and JSON carry every measure.
				</p>
			{/if}

			<QuestionData {figure} name={exportName} url={shareUrl} year={data.year} />

			{#if dev}
				<details class="block py-10">
					<summary class="w-fit cursor-pointer font-mono text-xs"
						>DEV ONLY <strong>chartId</strong>: {figure.chart} <strong>dataId</strong>: {figure.dataId}</summary
					>
					<pre
						class="mt-1 overflow-x-auto rounded border border-black/10 bg-black/3 p-4 text-xs leading-relaxed dark:border-white/15 dark:bg-white/5">{JSON.stringify(
							figure,
							null,
							2
						)}</pre>
				</details>
			{/if}
		</section>
	</div>
</svelte:element>

{#if !panel && (data.question.previous || data.question.next)}
	<nav class="relative top-px mt-24 text-sm" aria-label="Questions in this chapter">
		<div class="mx-auto flex max-w-300 justify-between gap-6 px-1">
			{#if data.question.previous}
				<Button
					variant="filled"
					rel="prev"
					icon={IconArrowLeft}
					label="Previous: {data.question.previous.name}"
					href={resolve('/[year]/[chapter]/data/[question]', {
						year: data.year,
						chapter: data.chapter.id,
						question: data.question.previous.slug,
					})}
				/>
			{/if}
			{#if data.question.next}
				<Button
					variant="filled"
					rel="next"
					class="ml-auto text-right"
					iconEnd={IconArrowRight}
					label="Next: {data.question.next.name}"
					href={resolve('/[year]/[chapter]/data/[question]', {
						year: data.year,
						chapter: data.chapter.id,
						question: data.question.next.slug,
					})}
				/>
			{/if}
		</div>
	</nav>
{/if}
