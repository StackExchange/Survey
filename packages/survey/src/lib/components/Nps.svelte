<script lang="ts">
	import { answers, setAnswer } from '$lib/store/answers.svelte'
	import type { Question } from '$lib/types'
	import Markdown from './Markdown.svelte'

	let { question }: { question: Question } = $props()
	const min = $derived(question.scale_min ?? 0)
	const max = $derived(question.scale_max ?? 10)
	const selected = $derived(answers[question.id] as number | undefined)
	const stops = $derived(Array.from({ length: max - min + 1 }, (_, i) => min + i))
</script>

<div class="nps">
	<div class="row">
		{#each stops as n (n)}
			<button type="button" class="stop" class:selected={selected === n} onclick={() => setAnswer(question.id, n)}>
				{n}
			</button>
		{/each}
	</div>
	{#if question.scale_labels?.min || question.scale_labels?.max}
		<div class="anchors">
			<span class="anchor"><Markdown inline content={question.scale_labels?.min ?? ''} /></span>
			<span class="anchor"><Markdown inline content={question.scale_labels?.max ?? ''} /></span>
		</div>
	{/if}
</div>

<style>
	.nps {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.row {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.stop {
		min-width: 2.4rem;
		padding: 0.5rem 0.7rem;
		border-radius: 0.3rem;
		border: 1px solid rgba(127, 127, 127, 0.4);
		background: transparent;
		cursor: pointer;
		font: inherit;
	}
	.stop:hover {
		background: rgba(127, 127, 127, 0.1);
	}
	.stop.selected {
		background: var(--accent, #6962d6);
		color: white;
		border-color: var(--accent, #6962d6);
	}
	.anchors {
		display: flex;
		justify-content: space-between;
		font-size: 0.85em;
		opacity: 0.8;
	}
</style>
