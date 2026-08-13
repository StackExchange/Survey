<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	// The HTML is rendered in scripts/data.js and arrives on the payload as a
	// `*Html` field beside its plain text. Doing it there rather than here keeps
	// `marked` out of the client bundle; this component is the styling only.
	//
	// Content is sheet and question-bank copy we write ourselves, never a
	// respondent, so it is not sanitised.
	interface Props {
		html?: string
		// Renders a span with no wrapping <p>, for copy inside a sentence.
		inline?: boolean
		class?: ClassValue
	}

	const { html = '', inline = false, class: className = '' }: Props = $props()
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
