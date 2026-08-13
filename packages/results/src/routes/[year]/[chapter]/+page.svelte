<script>
	import { resolve } from '$app/paths'
	import ChapterHeader from '$lib/components/ChapterHeader.svelte'
	import Highlight from '$charts/Highlight.svelte'
	import CopyPage from '$lib/components/CopyPage.svelte'
	import NavToggle from '$lib/components/NavToggle.svelte'
	import Quote from '$charts/text/Quote.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Seo from '$lib/components/Seo.svelte'
	import { IconArrowDownRight } from '@stackoverflow/stacks-icons/icons'
	import { SpotDataset } from '@stackoverflow/stacks-icons/spots'

	let { data, params } = $props()
</script>

<Seo title="{data.chapter.name} {data.year}" description={data.chapter.description} graph={data.chapter.jsonld} />

<ChapterHeader year={data.year} chapter={data.chapter} variant="chapter" />

<main id="main" tabindex="-1">
	<div class="container mx-auto my-8 flex items-center justify-between">
		<NavToggle
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

	<a
		href={resolve('/[year]/[chapter]/data', { year: params.year, chapter: params.chapter })}
		class="max-w-4xs fixed right-5 bottom-5 flex bg-black leading-snug hover:bg-orange-medium"
	>
		<Icon src={SpotDataset} class="native h-auto max-w-30 p-3" />
		<div class="p-3 pl-0">
			<div class="font-medium text-white">Explore {data.chapter.name} data</div>
			<div class="text-black-350">See the full breakdown</div>
			<div class="absolute right-0 bottom-0 mt-auto self-end bg-orange p-2 text-black"><Icon src={IconArrowDownRight} /></div>
		</div>
	</a>
</main>
