<script lang="ts">
	import { answers, setAnswer } from '$lib/store/answers.svelte'
	import { normaliseOptions } from '$lib/data/options'
	import type { Question } from '$lib/types'
	import Markdown from './Markdown.svelte'
	import KeyBadge from './KeyBadge.svelte'

	let { question }: { question: Question } = $props()
	const opts = $derived(normaliseOptions(question.options))
	const selected = $derived((answers[question.id] as string[] | undefined) ?? [])
	const maxSelections = $derived(question.validate?.type === 'selection_count' ? question.validate.max : undefined)

	function toggle(key: string) {
		const set = new Set(selected)
		if (set.has(key)) set.delete(key)
		else if (maxSelections !== undefined && selected.length >= maxSelections) return
		else set.add(key)
		setAnswer(question.id, [...set])
	}
</script>

<div class="choices">
	{#each opts as opt (opt.key)}
		<label class="choice">
			<input
				type="checkbox"
				name={question.id}
				value={opt.key}
				checked={selected.includes(opt.key)}
				disabled={maxSelections !== undefined && selected.length >= maxSelections && !selected.includes(opt.key)}
				onchange={() => toggle(opt.key)}
			/>
			<Markdown inline content={opt.label} />
			{#if opt.explicitKey}<KeyBadge value={opt.key} />{/if}
			{#if opt.textEntry && selected.includes(opt.key)}
				<input
					type="text"
					class="text-entry"
					placeholder="Please specify…"
					oninput={(e) => setAnswer(`${question.id}__${opt.key}_text`, (e.target as HTMLInputElement).value)}
				/>
			{/if}
		</label>
	{/each}
</div>

<style>
	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.choice {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		cursor: pointer;
		padding: 0.4rem 0.6rem;
		border-radius: 0.3rem;
	}
	.choice:hover {
		background: rgba(127, 127, 127, 0.08);
	}
	.text-entry {
		margin-left: 0.5rem;
		flex: 1;
		min-width: 12rem;
	}
</style>
