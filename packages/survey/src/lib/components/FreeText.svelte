<script lang="ts">
	import { answers, setAnswer } from '$lib/store/answers.svelte'
	import type { Question } from '$lib/types'

	let { question }: { question: Question } = $props()
	const value = $derived((answers[question.id] as string | undefined) ?? '')

	const helper = $derived.by(() => {
		const v = question.validate
		if (!v) return null
		if (v.type === 'number') {
			const parts: string[] = [v.decimals && v.decimals > 0 ? `Number (up to ${v.decimals} decimals)` : 'Whole number']
			if (v.min !== undefined && v.max !== undefined) parts.push(`${v.min}–${v.max}`)
			else if (v.min !== undefined) parts.push(`≥ ${v.min}`)
			else if (v.max !== undefined) parts.push(`≤ ${v.max}`)
			return parts.join(', ')
		}
		switch (v.type) {
			case 'email':
				return 'Email address'
			case 'phone':
				return 'Phone number'
			case 'zip':
				return 'ZIP / postal code'
			case 'date':
				return 'Date'
			default:
				return null
		}
	})
</script>

{#if question.lines === 'multi'}
	<textarea rows="4" {value} oninput={(e) => setAnswer(question.id, (e.target as HTMLTextAreaElement).value)}></textarea>
{:else}
	<input
		type={question.validate?.type === 'number' ? 'number' : 'text'}
		{value}
		oninput={(e) => setAnswer(question.id, (e.target as HTMLInputElement).value)}
	/>
{/if}
{#if helper}
	<p class="helper">{helper}</p>
{/if}

<style>
	input,
	textarea {
		width: 100%;
		padding: 0.5rem;
		border-radius: 0.3rem;
		font: inherit;
	}
	.helper {
		margin: 0.25rem 0 0;
		font-size: 0.85em;
		opacity: 0.7;
	}
</style>
