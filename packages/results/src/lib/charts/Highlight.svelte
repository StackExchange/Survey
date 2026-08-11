<script lang="ts">
	// A chapter's Highlight (2D) feature: copy in one column, chart in the other.
	// `flip` moves them visually only — the copy stays first in the DOM, so the
	// headline is still what a reader reaches before the figure.
	import { charts } from '$charts'
	import Markdown from '$lib/components/Markdown.svelte'

	import type { Snippet } from 'svelte'

	let { block, flip = false, children }: { block: any; flip?: boolean; children?: Snippet } = $props()

	const Chart = $derived(charts[block.chart as keyof typeof charts])

	// The wide column follows the chart, not the side.
	const columns = $derived(flip ? 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]')

	// See the note in Figure.svelte: drawn at the width it gets, not scaled into it.
	let measured = $state(0)
	const width = $derived(measured || 800)
</script>

<div class="grid items-start gap-10 {columns}">
	<div class="max-w-md {flip ? 'lg:order-2' : ''}">
		{#if children}
			{@render children()}
		{:else}
			<h3 class="font-headline text-4xl font-normal">{block.headline}</h3>
			{#if block.description}
				<Markdown content={block.description} class="text-black-400 dark:text-black-300 mt-4 text-base" />
			{/if}
		{/if}
	</div>

	<div bind:clientWidth={measured} class="[&>svg]:h-auto [&>svg]:w-full {flip ? 'lg:order-1' : ''}">
		<Chart figure={block} {width} />
	</div>
</div>
