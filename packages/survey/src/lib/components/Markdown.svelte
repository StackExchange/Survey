<script lang="ts">
	import { mdToHtml } from '$lib/data/markdown'
	let { content = '', inline = false }: { content?: string; inline?: boolean } = $props()
	const html = $derived(mdToHtml(content ?? ''))
</script>

{#if inline}
	<span class="md">{@html html}</span>
{:else}
	<div class="md">{@html html}</div>
{/if}

<style>
	.md :global(p) {
		margin: 0 0 0.5em 0;
	}
	.md :global(p:last-child) {
		margin-bottom: 0;
	}
	.md :global(ul) {
		margin: 0.5em 0;
		padding-left: 1.5em;
	}
	.md :global(a) {
		color: var(--accent, #6962d6);
	}
</style>
