<script lang="ts">
	import Figure from '$components/Figure.svelte'
	import Seo from '$components/Seo.svelte'

	import Prose from '$charts/text/Prose.svelte'
	import Quote from '$charts/text/Quote.svelte'

	let { data } = $props()
</script>

<Seo {...data.seo} graph={data.jsonld} />

<main id="main" tabindex="-1">
	<header class="mb-10 bg-black-100 bg-[url(/img/home-pryamid.svg)] bg-cover bg-bottom-right bg-no-repeat">
		<div class="mx-auto max-w-3xl px-7 pt-30">
			<h1 class="font-headline text-5xl">
				<span class="inline-block bg-white dark:bg-black px-4 py-2">Methodology</span>
			</h1>
		</div>
	</header>

	{#each data.blocks as block, i (`${block.chart}-${i}`)}
		<article>
			{#if block.kind === 'text'}
				<div class="my-15 px-6">
					<Prose headlineClass="text-3xl md:text-4xl mt-10" {block} />
				</div>
			{:else}
				<div class="border-t border-black-200 py-15 dark:border-black-500">
					<div class="container mx-auto flex flex-col items-stretch gap-6 lg:flex-row">
						<header class="flex basis-1/4 flex-col">
							<h3 class="my-3 font-headline text-3xl leading-8">{block.headline}</h3>
							{#if block.description}
								<div class="md text-black-400 dark:text-black-300">{@html block.descriptionHtml}</div>
							{/if}
						</header>

						<div class="flex min-w-0 shrink basis-3/4 flex-col">
							<Figure {block} table />
						</div>
					</div>
				</div>
			{/if}
		</article>
	{/each}
</main>
