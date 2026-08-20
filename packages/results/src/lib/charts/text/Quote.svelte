<script lang="ts">
	let { block }: { block: any } = $props()

	const cite = $derived(block.descriptionHtml?.trim())
</script>

<blockquote class="mx-auto max-w-4xl text-center">
	<p class="font-headline text-[clamp(var(--text-2xl),3vw+0.5rem,var(--text-5xl))] leading-tight font-normal text-balance">
		“{block.headline}”
	</p>

	{#if cite}
		<footer class="mt-6 text-base text-black-400 dark:text-black-300">
			<div class="md">{@html cite}</div>
		</footer>
	{/if}
</blockquote>
