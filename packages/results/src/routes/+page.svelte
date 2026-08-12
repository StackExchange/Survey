<script lang="ts">
	import { IconArrowDownBox, IconChart, IconServiceGitHub } from '@stackoverflow/stacks-icons/icons'

	import { githubRepo, siteDescriptionLong } from '$lib/constants'

	import BrandHeader from '$lib/components/BrandHeader.svelte'
	import ThemeToggle from '$lib/components/ThemeToggle.svelte'
	import Button from '$lib/components/Button.svelte'

	import { graph, JsonLd, Seo } from '$lib/seo'

	let { data } = $props()

	interface Year {
		year: number
		results: string
		data: string | null
		source: string | null
	}

	// A year with no `results` URL in the archive index is not published yet, so
	// the newest published year leads and the rest fall into the list below. The
	// cast is the filter: every entry that survives it has a `results` URL.
	const published = $derived(data.years.filter(({ results }) => results) as Year[])
	const current = $derived(published[0])
	const past = $derived(published.slice(1))

	const home = $derived({
		path: '/',
		title: 'Stack Overflow Developer Survey',
		description: siteDescriptionLong,
		markdown: '/index.md',
	})

	const nodes = $derived([
		graph.organization(),
		graph.website(),
		graph.webPage(home, graph.ids.catalog),
		graph.breadcrumbs([{ name: 'Developer Survey', path: '/' }]),
		graph.catalog(published),
	])
</script>

<!-- Every year URL comes from the archive index as a string, so there is no route
     id for `resolve` to check. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet links(entry: Year)}
	<div class="-ml-3 flex flex-wrap gap-1">
		<Button variant="plain" href={entry.results} data-sveltekit-reload icon={IconChart} label="Results" />

		{#if entry.data}
			<Button variant="plain" href={entry.data} rel="external" icon={IconArrowDownBox} label="Data (CSV)" />
		{/if}
		{#if entry.source}
			<Button variant="plain" href={entry.source} rel="external noopener" icon={IconServiceGitHub} label="Files" />
		{/if}
	</div>
{/snippet}

<Seo description={siteDescriptionLong} />
<JsonLd graph={nodes} />

<div class="fixed top-0 right-0 z-50 flex">
	<ThemeToggle />
</div>

<BrandHeader>
	<div class="mt-16">
		<h2 class="font-headline text-3xl font-semibold">
			<a class="bg-blue text-black inline-block px-3 py-1" href={current.results} data-sveltekit-reload>
				{current.year}
			</a>
		</h2>

		<div class="text-lg bg-black-500 dark:bg-black-200 text-white dark:text-black pt-6 px-6 pb-3 max-w-full lg:max-w-1/2 leading-snug">
			<p class="mb-6">{siteDescriptionLong}</p>

			{@render links(current)}
		</div>
	</div>
</BrandHeader>

<main id="main" tabindex="-1">
	<div class="gutter-x my-10">
		<h2 id="past-years" class="font-headline text-2xl font-semibold">Past years</h2>
		<p class="mt-3 max-w-prose">
			All data from previous years can be found in the <a class="underline" rel="external" href={githubRepo}>GitHub repository</a>.
		</p>
	</div>

	<ul class="border-black-200 mb-10">
		{#each past as entry, index (entry.year)}
			<li
				class="border-black-200 dark:border-black-500 {index !== 0 ? 'border-t' : ''} {index % 2 ? 'bg-black-100 dark:bg-black-500' : ''}"
			>
				<div class="gutter flex flex-wrap items-center gap-x-5 gap-y-1 py-2">
					<span class="font-headline w-20 text-2xl font-semibold">{entry.year}</span>
					{@render links(entry)}
				</div>
			</li>
		{/each}
	</ul>
</main>
