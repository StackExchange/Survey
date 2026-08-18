<script>
	import BrandHeader from '$lib/components/BrandHeader.svelte'
	import ChapterHeader from '$lib/components/ChapterHeader.svelte'
	import Hero from '$charts/Hero.svelte'
	import Quote from '$charts/text/Quote.svelte'
	import Seo from '$lib/components/Seo.svelte'

	let { data } = $props()
</script>

<Seo title="Results {data.year}" graph={data.jsonld} />

<BrandHeader label={data.year} />

<main id="main" class="min-h-screen" tabindex="-1">
	<section class="container mt-10">
		<p class="mt-3 text-lg">{data.settings.description}</p>
	</section>

	<section class="mt-12" aria-label="Highlights">
		{#each data.chapters as chapter (chapter.id)}
			<section class="mt-6 min-h-screen bg-black-150 py-30 dark:bg-black-600">
				<ChapterHeader year={data.year} {chapter} variant="overview" />

				{#each chapter.heroes as hero, i (`${chapter.id}-hero-${i}`)}
					{#if hero.kind === 'quote'}
						<article class="mx-auto max-w-2/3 py-40">
							<Quote block={hero} />
						</article>
					{:else}
						<article class="mx-auto max-w-2/3 py-40">
							<Hero block={hero} year={data.year} {chapter} flip={i % 2 === 1} />
						</article>
					{/if}
				{/each}
			</section>
		{/each}
	</section>
</main>
