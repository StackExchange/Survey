<script lang="ts">
	import type { Question } from '$lib/types'
	import Markdown from './Markdown.svelte'
	import SingleSelect from './SingleSelect.svelte'
	import Dropdown from './Dropdown.svelte'
	import MultiSelect from './MultiSelect.svelte'
	import Nps from './Nps.svelte'
	import FreeText from './FreeText.svelte'
	import Rank from './Rank.svelte'
	import Scale from './Scale.svelte'
	import Display from './Display.svelte'

	let { question }: { question: Question } = $props()
</script>

{#if question.type === 'meta'}
	<!-- meta questions are auto-collected, not rendered -->
{:else if question.type === 'display'}
	<section class="q q-display">
		<code class="qid" title="Question id">{question.id}</code>
		<Display {question} />
	</section>
{:else}
	<section class="q">
		<code class="qid" title="Question id">{question.id}</code>
		<h2 class="title">
			<Markdown inline content={question.title} />
			{#if question.required}<span class="req" aria-label="required">*</span>{/if}
		</h2>
		{#if question.type === 'single_select' && question.display === 'dropdown'}
			<Dropdown {question} />
		{:else if question.type === 'single_select'}
			<SingleSelect {question} />
		{:else if question.type === 'multi_select'}
			<MultiSelect {question} />
		{:else if question.type === 'nps'}
			<Nps {question} />
		{:else if question.type === 'free_text'}
			<FreeText {question} />
		{:else if question.type === 'rank'}
			<Rank {question} />
		{:else if question.type === 'scale'}
			<Scale {question} />
		{/if}
	</section>
{/if}

<style>
	.q {
		padding: 3rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		border-bottom: 1px solid rgba(127, 127, 127, 0.15);
	}
	.q:last-child {
		border-bottom: none;
	}
	.title {
		font-size: 1.05rem;
		font-weight: 600;
		margin: 0;
		line-height: 1.4;
	}
	.req {
		color: #d33;
		margin-left: 0.2rem;
	}
	.qid {
		align-self: flex-start;
		font-size: 0.75em;
		padding: 0.1rem 0.4rem;
		border-radius: 0;
		background: rgba(127, 127, 127, 0.15);
		color: inherit;
		opacity: 0.7;
	}
	.q-display {
		padding: 1rem 0;
	}
</style>
