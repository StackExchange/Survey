<script lang="ts">
	import { answers, setAnswer } from '$lib/store/answers.svelte'
	import { normaliseOptions } from '$lib/data/options'
	import type { Question } from '$lib/types'

	let { question }: { question: Question } = $props()
	const opts = $derived(normaliseOptions(question.options))
	const selected = $derived((answers[question.id] as string | undefined) ?? '')
</script>

<select value={selected} onchange={(e) => setAnswer(question.id, (e.target as HTMLSelectElement).value || undefined)}>
	<option value="" disabled selected={!selected}>Select…</option>
	{#each opts as opt (opt.key)}
		<option value={opt.key}>{opt.label}</option>
	{/each}
</select>

<style>
	select {
		min-width: 18rem;
		padding: 0.5rem;
		border-radius: 0.3rem;
	}
</style>
