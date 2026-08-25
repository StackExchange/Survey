<script lang="ts">
	// A passage between the figures. No data behind it, so it carries an optional
	// headline and its copy at reading measure rather than the full column.
	let { block }: { block: any } = $props()

	const copy = $derived(block.descriptionHtml?.trim())
</script>

<div class="mx-auto max-w-prose">
	{#if block.headline}
		<p class="font-headline text-5xl font-normal">{block.headline}</p>
	{/if}

	{#if copy}
		<div class="md text-lg {block.headline ? 'mt-7' : ''}">{@html copy}</div>
	{/if}
</div>
