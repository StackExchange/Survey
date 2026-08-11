<script>
	import BrandHeader from '$lib/components/BrandHeader.svelte'
	import ChapterHeader from '$lib/components/ChapterHeader.svelte'
	import Hero from '$charts/Hero.svelte'
	import Quote from '$charts/text/Quote.svelte'
	import { graph, JsonLd, Seo } from '$lib/seo'

	let { data } = $props()

	const year = $derived(data.year)

	const nodes = $derived([
		graph.organization(),
		graph.website(),
		graph.webPage(
			{
				path: `/${year}`,
				title: `Stack Overflow Developer Survey ${year}`,
				description: data.settings.description,
				markdown: `/${year}.md`,
			},
			graph.ids.dataset(`/${year}`)
		),
		graph.breadcrumbs([
			{ name: 'Developer Survey', path: '/' },
			{ name: year, path: `/${year}` },
		]),
		graph.yearDataset(
			year,
			data.settings,
			data.chapters.map((c) => c.id)
		),
	])
</script>

<Seo title="Results {data.year}" />
<JsonLd graph={nodes} />

<BrandHeader label={data.year} />

<main id="main" class="min-h-screen" tabindex="-1">
	<section class="container mt-10">
		<p class="mt-3 text-lg">{data.settings.description}</p>
	</section>

	<section class="mt-12" aria-label="Highlights">
		{#each data.chapters as chapter (chapter.id)}
			<section class="mt-6 py-30 min-h-screen bg-black-150 dark:bg-black-600">
				<ChapterHeader year={data.year} {chapter} variant="overview" />

				{#each chapter.heroes as hero, i (`${chapter.id}-hero-${i}`)}
					{#if hero.kind === 'quote'}
						<article class="max-w-2/3 mx-auto py-40">
							<Quote block={hero} />
						</article>
					{:else}
						<article class="max-w-2/3 mx-auto py-40">
							<Hero block={hero} year={data.year} {chapter} flip={i % 2 === 1} />
						</article>
					{/if}
				{/each}
			</section>
		{/each}
	</section>
</main>
