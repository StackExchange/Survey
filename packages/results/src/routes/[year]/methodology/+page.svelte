<script lang="ts">
	import Feature from '$components/Feature.svelte'
	import Seo from '$components/Seo.svelte'

	import Prose from '$charts/text/Prose.svelte'
	import Quote from '$charts/text/Quote.svelte'

	let { data } = $props()
</script>

<Seo {...data.seo} graph={data.jsonld} />

<main id="main" tabindex="-1">
	<header class="mb-10 bg-black-100">
		<div class="mx-auto max-w-3xl px-6 pt-20 pb-8">
			<h1 class="font-headline text-3xl">Methodology</h1>
			<p class="mt-3 text-xl">How the survey was run, who answered it, and how the numbers here were worked out.</p>
		</div>
	</header>

	{#each data.blocks as block, i (`${block.chart}-${i}`)}
		<article class="mt-6 px-6">
			<div class="mx-auto max-w-310">
				{#if block.kind === 'text'}
					<Prose {block} />
				{:else if block.kind === 'quote'}
					<Quote {block} />
				{:else}
					<Feature {block} flip={i % 2 === 1} />
				{/if}
			</div>
		</article>
	{/each}

	<div class="h-16"></div>
</main>
