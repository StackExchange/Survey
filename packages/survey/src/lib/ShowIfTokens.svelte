<script lang="ts">
	import type { ShowIfToken } from '$lib/data/format_show_if'

	let { tokens, onJump }: { tokens: ShowIfToken[]; onJump: (qid: string) => void } = $props()
</script>

{#each tokens as t, i (i)}
	{#if 'qid' in t}
		<button type="button" class="qid-link" title={`Jump to ${t.qid}`} onclick={() => onJump(t.qid)}>{t.qid}</button>
	{:else}
		{t.text}
	{/if}
{/each}

<style>
	.qid-link {
		font: inherit;
		background: rgba(127, 127, 127, 0.18);
		border: none;
		color: inherit;
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 2px;
		cursor: pointer;
		padding: 0 0.3rem;
		border-radius: 0.2rem;
	}
	.qid-link:hover {
		background: rgba(105, 98, 214, 0.25);
	}
</style>
