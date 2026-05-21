<script lang="ts">
	import type { ConditionToken } from '$lib/data/format_condition'

	let { tokens, onJump }: { tokens: ConditionToken[]; onJump: (qid: string) => void } = $props()
</script>

<span class="tokens">
	{#each tokens as t, i (i)}
		{#if 'qid' in t}
			<button type="button" class="qid-link" title={`Jump to ${t.qid}`} onclick={() => onJump(t.qid)}>{t.qid}</button>
		{:else}
			{t.text}
		{/if}
	{/each}
</span>

<style>
	/* pre-wrap so \n separators emitted by tokenizeCondition become real line
	   breaks — each OR/AND in a multi-clause condition flows onto a new line. */
	.tokens {
		white-space: pre-wrap;
	}
	.qid-link {
		font: inherit;
		background: transparent;
		border: none;
		color: inherit;
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 2px;
		cursor: pointer;
		padding: 0;
		border-radius: 0;
	}
	.qid-link:hover {
		background: rgba(105, 98, 214, 0.25);
	}
</style>
