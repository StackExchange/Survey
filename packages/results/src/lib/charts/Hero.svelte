<script lang="ts">
	import { resolve } from '$app/paths'
	import { charts } from '$charts'
	import { IconArrowRight } from '@stackoverflow/stacks-icons/icons'
	import ChapterHeader from '$lib/components/ChapterHeader.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Markdown from '$lib/components/Markdown.svelte'
	import { openQuestion } from '$lib/panel'

	import type { Snippet } from 'svelte'

	let {
		block,
		year,
		chapter,
		flip = false,
		children,
	}: { block: any; year: string; chapter: any; flip?: boolean; children?: Snippet } = $props()

	const Chart = $derived(charts[block.chart as keyof typeof charts])

	const columns = $derived(flip ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]' : 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]')

	let measured = $state(0)
	const width = $derived(measured || 800)

	// A handful of promoted questions aren't asked in a section, so they have no
	// question page — those fall back to the chapter and navigate as usual.
	const question = $derived(
		block.slug ? resolve('/[year]/[chapter]/data/[question]', { year, chapter: chapter.id, question: block.slug }) : null
	)
</script>

<section class="grid items-start gap-10 py-10 {columns}">
	<div class={flip ? '' : 'lg:order-2'}>
		<ChapterHeader {year} {chapter} variant="panel" section={block.section}>
			{#if children}
				{@render children()}
			{:else}
				<div class="bg-white p-5 dark:bg-black-600">
					<h4 class="font-headline text-3xl font-normal">{block.headline}</h4>
					{#if block.description}
						<Markdown content={block.description} class="text-black-400 dark:text-black-300 mt-3 text-base" />
					{/if}
				</div>

				<!-- eslint-disable svelte/no-navigation-without-resolve -- both branches are resolve()d above -->
				<a
					class="bg-black-150 hover:bg-orange dark:bg-black-500 dark:hover:bg-orange dark:hover:text-black flex w-fit items-center gap-2 self-end px-5 py-3"
					href={question ?? resolve('/[year]/[chapter]', { year, chapter: chapter.id })}
					onclick={(event) => question && openQuestion(event, question)}
				>
					Dig deeper
					<Icon src={IconArrowRight} />
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/if}
		</ChapterHeader>
	</div>

	<div bind:clientWidth={measured} class="[&>svg]:h-auto [&>svg]:w-full {flip ? '' : 'lg:order-1'}">
		<Chart figure={block} {width} />
	</div>
</section>
