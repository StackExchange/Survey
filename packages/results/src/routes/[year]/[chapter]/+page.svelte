<script>
	import { SpotDataset } from '@stackoverflow/stacks-icons/spots'

	import { resolve } from '$app/paths'

	import ChapterHeader from '$components/ChapterHeader.svelte'
	import ChapterJump from '$components/ChapterJump.svelte'
	import ChapterNextPrev from '$components/ChapterNextPrev.svelte'
	import CopyPage from '$components/CopyPage.svelte'
	import ButtonToggle from '$components/ButtonToggle.svelte'
	import Seo from '$components/Seo.svelte'

	import Highlight from '$charts/Highlight.svelte'
	import Quote from '$charts/text/Quote.svelte'

	let { data, params } = $props()
</script>

<Seo title="{data.chapter.name} {data.year}" description={data.chapter.description} graph={data.chapter.jsonld} />

<ChapterHeader year={data.year} chapter={data.chapter} variant="chapter" />

<main id="main" tabindex="-1">
	<div class="container mx-auto my-8 flex items-center justify-between">
		<ButtonToggle
			options={[
				{ href: resolve('/[year]/[chapter]', { year: params.year, chapter: params.chapter }), label: 'Overview' },
				{ href: resolve('/[year]/[chapter]/data', { year: params.year, chapter: params.chapter }), label: 'Full data' },
			]}
		/>
		<CopyPage title="the {data.chapter.name} chapter" />
	</div>

	<div class="container mx-auto mb-60">
		<div class="md max-w-prose text-lg">{@html data.chapter.descriptionLongHtml}</div>
	</div>

	{#each data.chapter.highlights as block, i (`${block.chart}-${i}`)}
		<article class="mx-auto my-[15vh] w-full max-w-360 px-6">
			{#if block.kind === 'quote'}
				<Quote {block} />
			{:else}
				<Highlight {block} flip={i % 2 !== 1} />
			{/if}
		</article>
	{/each}

	<ChapterJump
		href={resolve('/[year]/[chapter]/data', { year: params.year, chapter: params.chapter })}
		spot={SpotDataset}
		title="Explore {data.chapter.name} data"
		subtitle="See the full breakdown"
	/>
</main>

<ChapterNextPrev year={data.year} previous={data.chapter.previous} next={data.chapter.next} />
