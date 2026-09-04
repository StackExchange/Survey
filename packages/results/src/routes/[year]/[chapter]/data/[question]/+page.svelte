<script lang="ts">
	import type { PageData } from './$types'

	import { IconArrowLeft, IconArrowRight, IconListOrdered, IconQuestion, IconTrendUp } from '@stackoverflow/stacks-icons/icons'

	import { dev } from '$app/environment'
	import { replaceState } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'

	import { rowSelection } from '$charts/utils/rows.svelte'
	import { githubReleaseBranch, githubRepo, siteUrl, surveyPreview } from '$config'
	import { respondents } from '$lib/table'

	import Button from '$components/Button.svelte'
	import ChapterHeader from '$components/ChapterHeader.svelte'
	import CopyPage from '$components/CopyPage.svelte'
	import Figure from '$components/Figure.svelte'
	import Icon from '$components/Icon.svelte'
	import QuestionData from '$components/QuestionData.svelte'
	import QuestionTabs, { tabId } from '$components/QuestionTabs.svelte'
	import Seo from '$components/Seo.svelte'
	import Share from '$components/Share.svelte'

	import { FOCUSABLE, isExportable, SCALABLE } from '$charts'
	import ChartDownload from '$charts/ChartDownload.svelte'
	import ChartOptions from '$charts/ChartOptions.svelte'
	import DataTable from '$charts/text/DataTable.svelte'

	// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages -- QuestionPanel instantiates this itself; the router only ever passes `data`
	let { data, panel = false }: { data: PageData; panel?: boolean } = $props()

	let chosen = $state<{ question: string; id: string } | null>(null)
	const demographics = $derived(data.question.demographics)
	const fallback = $derived(demographics[0])
	const current = $derived(
		(chosen?.question === data.question.id && demographics.find((d: any) => d.demographic.id === chosen?.id)) || fallback
	)
	const figure = $derived({ ...data.question, ...current })
	const definitions = $derived(figure.definitions ?? [])
	const selection = rowSelection(() => figure)
	let normalise = $state(true)
	const scalable = $derived(SCALABLE.has(figure.chart) && !figure.value)
	const focusable = $derived(FOCUSABLE.has(figure.chart))
	const exportable = $derived(isExportable(figure))
	const sampled = $derived(Boolean(figure.sampled))
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

	const askedSource = (definition: any) => `${githubRepo}/blob/${githubReleaseBranch(data.year)}/${definition.source}`
	const fullDataUrl = $derived(
		`${githubRepo}/blob/${githubReleaseBranch(data.year)}/packages/archive/${data.year}/json/${data.chapter.id}_${figure.dataId}.json`
	)
	const askedInContext = (definition: any) => `${surveyPreview(data.year)}/#q-${definition.id}`
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
	<Seo {...data.seo} graph={data.jsonld} />
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
	<div class="mx-auto mb-6 max-w-300 px-6">
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

			<div class="flex flex-col justify-stretch gap-3 max-lg:*:w-full sm:gap-4 lg:flex-row">
				<Share url={shareUrl} title="{data.question.name} — Stack Overflow Developer Survey {data.year}" compact={false} />
				<CopyPage title="the question &quot;{data.question.name}&quot;" compact={false} />
			</div>
		</header>

		{#if demographics.length > 1 || (exportable && (selection.listable || scalable))}
			<div class="flex flex-wrap items-end gap-4 border-b border-black-150 dark:border-black-500">
				{#if demographics.length > 1}
					<QuestionTabs {demographics} selected={current.demographic.id} panelId="figure" onselect={choose} />
				{/if}

				{#if exportable}
					<div class="order-first ml-auto lg:order-last">
						<ChartOptions {selection} {scalable} {focusable} bind:normalise />
					</div>
				{/if}
			</div>
		{/if}

		<ChartDownload {figure} name={exportName} year={data.year} url={shareUrl} {selection} bind:normalise>
			{#snippet chart({ block, chrome, width }: any)}
				<!-- The panel holds no focusable content as it’s an SVG -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					id="figure"
					role={demographics.length > 1 ? 'tabpanel' : undefined}
					tabindex={demographics.length > 1 ? 0 : undefined}
					aria-labelledby={demographics.length > 1 ? tabId('figure', current.demographic.id) : undefined}
				>
					<Figure {block} {chrome} {width} />
				</div>
			{/snippet}
		</ChartDownload>
	</div>

	<div class="border-t border-black-200 py-8 dark:border-black-500">
		<section class="mx-auto max-w-300 px-6" id="data" aria-labelledby="asked">
			<h2 id="asked" class="inline-flex items-center gap-2 bg-black-100 pr-2 dark:bg-transparent">
				<span class="bg-blue-light p-1.5"><Icon src={IconQuestion} class="native shrink-0" /></span>
				{definitions.length > 1 ? 'Questions' : 'Question'}
			</h2>

			{#each definitions as definition (definition.id)}
				{@const qMeta = [
					definition.dataId,
					definition.type.replace(/_/g, ' '),
					definition.required ? 'Required' : 'Optional',
					`v${definition.version}`,
					definition.randomize && 'Randomized',
					definition.carry_forward?.from && `Carries forward ${definition.carry_forward.from}`,
				].filter(Boolean)}

				<div class="mt-6 grid-cols-10 gap-10 lg:grid">
					<div class="col-span-7">
						<div class="mb-4 font-headline text-xl">
							{@html definition.titleHtml}
						</div>
						<ul class="flex flex-wrap text-sm text-black-400 dark:text-black-300">
							{#each qMeta as item (item)}
								<li class="capitalize not-first:before:mx-2 not-first:before:content-['·']">{item}</li>
							{/each}
						</ul>
					</div>
					<ul class="col-span-3 mt-3 flex flex-col gap-y-1 lg:mt-0">
						<li>
							<Button
								variant="link"
								href={askedInContext(definition)}
								label="View in survey"
								iconEnd={IconArrowRight}
								class="lg:w-full lg:justify-between"
							/>
						</li>
						{#if definition.source}
							<li>
								<Button
									variant="link"
									href={askedSource(definition)}
									label="Question definition (.yaml)"
									iconEnd={IconArrowRight}
									class="lg:w-full lg:justify-between"
								/>
							</li>
						{/if}
					</ul>
				</div>
			{/each}
		</section>
	</div>

	{#if exportable}
		<div class="border-t border-black-200 py-8 dark:border-black-500">
			<section class="mx-auto max-w-300 px-6" aria-labelledby="responses">
				<h2 id="responses" class="mb-4 inline-flex items-center gap-2 bg-black-100 pr-2 dark:bg-transparent">
					<span class="bg-blue-light p-1.5"><Icon src={IconListOrdered} class="native shrink-0" /></span>
					Data
				</h2>

				<DataTable {figure} />
			</section>
		</div>
	{/if}

	<div class="border-t border-black-200 py-8 dark:border-black-500">
		<section class="mx-auto max-w-300 px-6" aria-labelledby="export">
			<h2 id="export" class="mb-4 inline-flex items-center gap-2 bg-black-100 pr-2 dark:bg-transparent">
				<span class="bg-blue-light p-1.5"><Icon src={IconTrendUp} class="native" /></span>
				Use this data
			</h2>

			{#if sampled}
				<p class="mb-4 text-sm text-black-400 dark:text-black-300">
					Showing a sample of {respondents(figure.data.length)} of {respondents(figure.demographic.n)} responses —
					<a class="underline" href={fullDataUrl}>the full data is on GitHub</a>.
				</p>
			{/if}

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
