<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { mdToHtml } from '$lib/markdown'

	// Content is chapter YAML we write ourselves, never a respondent, so it is not
	// sanitised.
	interface Props {
		content?: string
		// Renders a span with no wrapping <p>, for copy inside a sentence.
		inline?: boolean
		class?: ClassValue
	}

	const { content = '', inline = false, class: className = '' }: Props = $props()

	const html = $derived(mdToHtml(content ?? ''))
</script>

{#if inline}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- authored content, not user input -->
	<span class="md {className}">{@html html}</span>
{:else}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- authored content, not user input -->
	<div class="md {className}">{@html html}</div>
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
		text-decoration: underline;
	}
</style>
