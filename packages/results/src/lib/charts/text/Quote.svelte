<script lang="ts">
	// A `quote` feature — no chart, no data. `<blockquote>` rather than a styled
	// paragraph, so it is still a quotation with the CSS off.
	import Markdown from '$lib/components/Markdown.svelte'

	let { block }: { block: any } = $props()

	// `description` is the attribution; most quotes leave it empty.
	const cite = $derived(block.descriptionHtml?.trim())
</script>

<blockquote class="mx-auto max-w-4xl text-center">
	<p class="font-headline text-[clamp(var(--text-2xl),3vw+0.5rem,var(--text-5xl))] leading-tight font-normal text-balance">
		“{block.headline}”
	</p>

	{#if cite}
		<footer class="text-black-400 dark:text-black-300 mt-6 text-base">
			<Markdown html={cite} />
		</footer>
	{/if}
</blockquote>
