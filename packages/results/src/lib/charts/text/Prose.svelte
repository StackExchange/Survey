<script lang="ts">
	let { block }: { block: any } = $props()

	const copy = $derived(block.descriptionHtml?.trim())
</script>

<div class="mx-auto max-w-prose">
	{#if block.headline}
		<h2 class="font-headline text-4xl font-normal md:text-5xl">
			{block.headline}
		</h2>
	{/if}
	{#if copy}
		<div class="md text-lg {block.headline ? 'mt-7' : ''}">
			{@html copy}
		</div>
	{/if}
</div>
