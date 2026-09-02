<script lang="ts">
	let { block, headlineClass = 'text-4xl md:text-5xl' }: { block: any, headlineClass?: string } = $props()

	const copy = $derived(block.descriptionHtml?.trim())
</script>

<div class="mx-auto max-w-prose">
	{#if block.headline}
		<h2 class="{headlineClass} font-headline font-normal">
			{block.headline}
		</h2>
	{/if}
	{#if copy}
		<div class="md text-lg {block.headline ? 'mt-7' : ''}">
			{@html copy}
		</div>
	{/if}
</div>
