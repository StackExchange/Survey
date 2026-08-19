<script lang="ts">
	import type { PageData } from './$types'

	import { IconArrowLeft, IconArrowRight, IconLink } from '@stackoverflow/stacks-icons/icons'

	import { dev } from '$app/environment'
	import { replaceState } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'

	import { rowSelection } from '$charts/utils/rows.svelte'
	import { githubRepo, siteUrl } from '$config'
	import { ofSurvey } from '$lib/table'

	import Button from '$components/Button.svelte'
	import CopyPage from '$components/CopyPage.svelte'
	import DataExport from '$components/DataExport.svelte'
	import Demographics, { tabId } from '$components/Demographics.svelte'
	import Figure from '$components/Figure.svelte'
	import Seo from '$components/Seo.svelte'
	import { askedInContext, askedMeta } from '$components/WhatWeAsked.svelte'

	import ChartDownload from '$charts/ChartDownload.svelte'
	import DataTable from '$charts/text/DataTable.svelte'

	// Set only by QuestionPanel, which renders this page as a sheet over another
	// route — the head tags and skip-link target belong to that route.
	// eslint-disable-next-line svelte/valid-prop-names-in-kit-pages -- QuestionPanel instantiates this itself; the router only ever passes `data`
	let { data, panel = false }: { data: PageData; panel?: boolean } = $props()

	// Only this page lists the options, so these stay with it.
	const optionLabel = (option: any) => (typeof option === 'string' ? option : option.label)
	const optionFreeText = (option: any) => typeof option !== 'string' && Boolean(option.text_entry)

	// The YAML the question is defined in, on GitHub.
	const askedSource = (definition: any) => `${githubRepo}/blob/main/${definition.source}`

	const demographics = $derived(data.question.demographics)
	const fallback = $derived(demographics[0])

	// SvelteKit reuses this component across a prev/next navigation, so a bare id
	// would carry a stale group to the next chart.
	let chosen = $state<{ question: string; id: string } | null>(null)

	const current = $derived(
		(chosen?.question === data.question.id && demographics.find((d: any) => d.demographic.id === chosen?.id)) || fallback
	)

	const figure = $derived({ ...data.question, ...current })

	// Owned here because two places need it: the data table draws the controls,
	// ChartDownload draws and downloads the result.
	const selection = rowSelection(() => figure)

	// `page.url.searchParams` throws during prerendering, so `?d=` waits for the
	// browser.
	$effect(() => {
		const question = data.question.id
		const wanted = new URLSearchParams(location.search).get('d')
		chosen = wanted && demographics.some((d: any) => d.demographic.id === wanted) ? { question, id: wanted } : null
	})

	function choose(id: string) {
		chosen = { question: data.question.id, id }
		// replaceState, not pushState: back still means the previous page, and
		// `page.url` is left alone, which keeps the canonical clean.
		replaceState(id === fallback.demographic.id ? location.pathname : `${location.pathname}?d=${id}`, page.state)
	}

	const count = (n: number | null) => n?.toLocaleString('en-US') ?? '—'
	const share = $derived(ofSurvey(current.demographic?.share))

	const path = $derived(`/${data.year}/${data.chapter.id}/data/${data.question.id}`)

	// `location` is no use: the panel shallow-routes, so the URL bar is right but
	// `page.url` still names the page underneath.
	const shareUrl = $derived(
		`${dev ? page.url.origin : siteUrl}${path}${current.demographic.id === fallback.demographic.id ? '' : `?d=${current.demographic.id}`}`
	)

	// An export follows the selected group, so its filename has to say which.
	const exportName = $derived.by(() => {
		const base = `stackoverflow-dev-survey-${data.year}-${data.chapter.id}-${data.question.id}`
		if (current.demographic.id === fallback.demographic.id) return base
		// Demographic ids are Qualtrics' (`AISel_prof`), the filenames are kebab-case.
		return `${base}-${current.demographic.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
	})

	// Built from the default group: that is what the prerendered HTML shows.
</script>

{#if !panel}
	<Seo title="{data.question.name} {data.year}" description={data.question.description} graph={data.jsonld} />
{/if}

<div class="bg-black-100 pt-25 pb-5">
	<div class="container flex justify-between">
		<Button href={resolve('/[year]/[chapter]/data', { year: data.year, chapter: data.chapter.id })} icon={IconArrowLeft} variant="plain">
			All {data.chapter.name} data
		</Button>
		<label class="mr-4 ml-auto flex">
			<span class="sr-only">Link to this chart</span>
			<input type="url" value={shareUrl} readonly class="w-full min-w-2xs py-1.5" onfocus={(event) => event.currentTarget.select()} />
			<Button copy={shareUrl} icon={IconLink} title="Copy this url" variant="filled" size="icon" />
		</label>
		<CopyPage title="the question &quot;{data.question.name}&quot;" />
	</div>
</div>

<svelte:element this={panel ? 'div' : 'main'} id={panel ? undefined : 'main'} tabindex={panel ? undefined : -1} class="container mx-auto">
	{#if demographics.length > 1}
		<div class="mt-8 border-b border-black-150 dark:border-black-500">
			<Demographics {demographics} selected={current.demographic.id} panelId="figure" onselect={choose} />
		</div>
	{/if}

	<ChartDownload {figure} {selection} name={exportName} year={data.year} url={shareUrl} chapter={data.chapter}>
		{#snippet chart({ block, chrome }: any)}
			<div
				id="figure"
				role={demographics.length > 1 ? 'tabpanel' : undefined}
				aria-labelledby={demographics.length > 1 ? tabId('figure', current.demographic.id) : undefined}
			>
				<Figure {block} {chrome} />
			</div>
		{/snippet}
	</ChartDownload>

	<div class="mx-auto my-8 flex items-center justify-between"></div>

	<p class="sr-only" aria-live="polite">
		{current.demographic.name}, n = {count(current.demographic.n)}
		{#if share}
			({share})
		{/if}
	</p>

	<section class="mt-12" aria-labelledby="data-table">
		<h2 id="data-table" class="font-headline text-2xl font-semibold">Data table</h2>
		<p class="mt-1 text-sm text-black-400 dark:text-black-300">
			{current.demographic.name}, n = {count(current.demographic.n)}{#if share}
				({share}){/if}
		</p>

		<div class="mt-4"><DataTable {figure} {selection} caption={false} /></div>
	</section>

	{#if figure.definition}
		{@const definition = figure.definition}

		<section class="mt-12" aria-labelledby="asked">
			<h2 id="asked" class="font-headline text-2xl font-semibold">What we asked</h2>

			<div class="md mt-3 max-w-prose text-lg">{@html definition.titleHtml}</div>

			<p class="mt-2 text-sm text-black-400 dark:text-black-300">
				{askedMeta(definition)}{#if definition.carry_forward?.from}
					· options carried forward from {definition.carry_forward.from}{/if}
			</p>

			{#if definition.options?.length}
				<details class="mt-4">
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

			<p class="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
				<Button variant="link" href={askedInContext(definition)} label="View this question in context" iconEnd={IconArrowRight} />
				{#if definition.source}
					<Button variant="link" href={askedSource(definition)} label="{definition.source} on GitHub" iconEnd={IconArrowRight} />
				{/if}
			</p>
		</section>
	{/if}

	<DataExport {figure} name={exportName} url={shareUrl} year={data.year} />

	{#if dev}
		<details class="mt-8">
			<summary class="w-fit cursor-pointer font-mono text-xs">{figure.chart} · {figure.dataId}</summary>
			<pre
				class="mt-1 overflow-x-auto rounded border border-black/10 bg-black/3 p-4 text-xs leading-relaxed dark:border-white/15 dark:bg-white/5">{JSON.stringify(
					figure,
					null,
					2
				)}</pre>
		</details>
	{/if}

	{#if data.question.previous || data.question.next}
		<nav class="mt-12 flex justify-between gap-6 text-sm" aria-label="Questions in this chapter">
			{#if data.question.previous}
				<Button
					variant="link"
					rel="prev"
					icon={IconArrowLeft}
					label={data.question.previous.name}
					href={resolve('/[year]/[chapter]/data/[question]', {
						year: data.year,
						chapter: data.chapter.id,
						question: data.question.previous.slug,
					})}
				/>
			{/if}
			{#if data.question.next}
				<Button
					variant="link"
					rel="next"
					class="ml-auto text-right"
					iconEnd={IconArrowRight}
					label={data.question.next.name}
					href={resolve('/[year]/[chapter]/data/[question]', {
						year: data.year,
						chapter: data.chapter.id,
						question: data.question.next.slug,
					})}
				/>
			{/if}
		</nav>
	{/if}
</svelte:element>
