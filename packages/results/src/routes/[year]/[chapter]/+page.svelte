<script>
	import { resolve } from '$app/paths'
	import ChapterHeader from '$lib/components/ChapterHeader.svelte'
	import Highlight from '$charts/Highlight.svelte'
	import CopyPage from '$lib/components/CopyPage.svelte'
	import NavToggle from '$lib/components/NavToggle.svelte'
	import Quote from '$charts/text/Quote.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { graph, JsonLd, Seo } from '$lib/seo'
	import { IconArrowDownRight } from '@stackoverflow/stacks-icons/icons'
	import { SpotDataset } from '@stackoverflow/stacks-icons/spots'
	import Markdown from '$lib/components/Markdown.svelte'

	let { data, params } = $props()

	const year = $derived(data.year)
	const path = $derived(`/${year}/${data.chapter.id}`)

	const nodes = $derived([
		graph.organization(),
		graph.website(),
		graph.webPage({ path, title: `${data.chapter.name} ${year}`, description: data.chapter.description, markdown: `${path}.md` }),
		graph.breadcrumbs([
			{ name: 'Developer Survey', path: '/' },
			{ name: year, path: `/${year}` },
			{ name: data.chapter.name, path },
		]),
		graph.article(year, data.chapter),
	])
</script>

<Seo title="{data.chapter.name} {data.year}" description={data.chapter.description} />
<JsonLd graph={nodes} />

<ChapterHeader year={data.year} chapter={data.chapter} variant="chapter" />

<main id="main" tabindex="-1">
	<div class="flex justify-between items-center my-8 container mx-auto">
		<NavToggle
			options={[
				{ href: resolve('/[year]/[chapter]', { year: params.year, chapter: params.chapter }), label: 'Overview' },
				{ href: resolve('/[year]/[chapter]/data', { year: params.year, chapter: params.chapter }), label: 'Full data' },
			]}
		/>
		<CopyPage title="the {data.chapter.name} chapter" />
	</div>

	<div class="mx-auto container mb-60">
		<Markdown content={data.chapter.descriptionLong} class="text-lg max-w-prose" />
	</div>

	{#each data.chapter.highlights as block, i (`${block.chart}-${i}`)}
		<article class="max-w-360 px-6 w-full mx-auto my-[15vh]">
			{#if block.kind === 'quote'}
				<Quote {block} />
			{:else}
				<Highlight {block} flip={i % 2 !== 1} />
			{/if}
		</article>
	{/each}

	<a
		href={resolve('/[year]/[chapter]/data', { year: params.year, chapter: params.chapter })}
		class="max-w-4xs bg-black hover:bg-orange-medium fixed right-5 bottom-5 flex leading-snug"
	>
		<Icon src={SpotDataset} class="native max-w-30 h-auto p-3" />
		<div class="p-3 pl-0">
			<div class="text-white font-medium">Explore {data.chapter.name} data</div>
			<div class="text-black-350">See the full breakdown</div>
			<div class="text-black bg-orange self-end mt-auto p-2 absolute right-0 bottom-0"><Icon src={IconArrowDownRight} /></div>
		</div>
	</a>
</main>
