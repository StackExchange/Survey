<script lang="ts">
	import { resolve } from '$app/paths'
	import { githubRepo } from '$lib/constants'

	import BrandHeader from '$lib/components/BrandHeader.svelte'
	import ThemeToggle from '$lib/components/ThemeToggle.svelte'
	import { graph, JsonLd, Seo } from '$lib/seo'

	let { data } = $props()

	const currentYear = $derived(String(data.years[0].year))

	const home = $derived({
		path: '/',
		title: 'Stack Overflow Developer Survey',
		description: data.settings.descriptionLong,
		markdown: '/index.md',
	})

	const nodes = $derived([
		graph.organization(),
		graph.website(),
		graph.webPage(home, graph.ids.catalog),
		graph.breadcrumbs([{ name: 'Developer Survey', path: '/' }]),
		graph.catalog(data.years),
	])
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#snippet links(entry: (typeof data.years)[number])}
	<a class="underline" href={entry.results}>Results</a>

	{#if entry.data}
		<a class="underline" href={entry.data} rel="external">Data (CSV)</a>
	{/if}
	{#if entry.source}
		<a class="underline" href={entry.source} rel="external noopener">Files</a>
	{/if}
{/snippet}

<Seo description={data.settings.descriptionLong} />
<JsonLd graph={nodes} />

<div class="fixed top-0 right-0 z-50 flex">
	<ThemeToggle />
</div>

<BrandHeader>
	<div class="mt-16">
		<h2 class="font-headline text-3xl font-semibold">
			<a class="bg-blue text-black inline-block px-3 py-1" href={resolve('/[year]', { year: currentYear })}>
				{data.years[0].year}
			</a>
		</h2>

		<div class="text-lg bg-black-500 dark:bg-black-200 text-white dark:text-black py-5 px-6 max-w-full lg:max-w-1/2 leading-snug">
			<p class="mb-4">{data.settings.descriptionLong}</p>

			<a class="underline" href={resolve('/2026')}>Results</a>
			<!-- {@render links(data.years[0])} -->
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
		{#each data.years.slice(1) as entry, index (entry.year)}
			<li
				class="border-black-200 dark:border-black-500 {index !== 0 ? 'border-t' : ''} {index % 2 ? 'bg-black-100 dark:bg-black-500' : ''}"
			>
				<div class="gutter flex flex-wrap items-baseline gap-x-6 gap-y-1 py-4">
					<span class="font-headline w-20 text-xl font-semibold">{entry.year}</span>
					{@render links(entry)}
				</div>
			</li>
		{/each}
	</ul>
</main>
