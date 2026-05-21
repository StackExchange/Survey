<script lang="ts">
	import { answers } from '$lib/store/answers.svelte'
	import { evaluate } from '$lib/data/condition'
	import { tokenizeCondition } from '$lib/data/format_condition'
	import type { Page, Question } from '$lib/types'
	import QuestionView from '$lib/components/Question.svelte'
	import ConditionTokens from './ConditionTokens.svelte'

	let {
		page,
		questions,
		onJump,
		pageNumber,
	}: {
		page: Page
		questions: Record<string, Question>
		onJump: (qid: string) => void
		pageNumber?: number
	} = $props()

	const renderIds = $derived(page.questions.filter((id) => questions[id] && !questions[id].deprecated))
	const hidden = $derived(!!page.condition && !evaluate(page.condition, answers, questions))
</script>

<div class="page" class:dimmed={hidden}>
	{#if pageNumber !== undefined}
		<div class="page-tab" aria-hidden="true">{String(pageNumber).padStart(2, '0')}</div>
	{/if}

	{#if page.condition}
		<aside class="cond-notice" class:hidden class:shown={!hidden} aria-label={hidden ? 'Hidden page' : 'Conditional page'}>
			<span class="tag">{hidden ? 'Hidden' : 'Shown'}</span>
			<span class="hint">{hidden ? 'requires' : 'because'}</span>
			<code><ConditionTokens tokens={tokenizeCondition(page.condition)} {onJump} /></code>
		</aside>
	{/if}

	{#each renderIds as id (id)}
		{#if questions[id]}
			<QuestionView question={questions[id]} />
		{/if}
	{/each}

	{#if renderIds.length === 0}
		<p class="empty">No renderable questions on this page (all deprecated or unknown).</p>
	{/if}
</div>

<style>
	.page {
		position: relative;
		display: flex;
		flex-direction: column;
		margin: auto;
		background: var(--bg-page);
		max-width: 960px;
	}
	.page.dimmed :global(.q) {
		opacity: 0.55;
	}
	.page-tab {
		position: absolute;
		top: 10px;
		right: 10px;
		padding: 8px;
		background: var(--text-h);
		color: var(--bg-page);
		font-size: 0.85em;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}
	.cond-notice {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 3rem;
		background: rgba(127, 127, 127, 0.04);
		font-size: 0.85em;
	}
	.cond-notice.shown {
		background: rgba(34, 139, 34, 0.06);
	}
	.tag {
		display: inline-block;
		padding: 0.1rem 0.45rem;
		background: rgba(127, 127, 127, 0.2);
		font-size: 0.85em;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.cond-notice.shown .tag {
		background: rgba(34, 139, 34, 0.2);
		color: #1a6f1a;
	}
	@media (prefers-color-scheme: dark) {
		.cond-notice.shown .tag {
			color: #7ec97e;
		}
	}
	.hint {
		opacity: 0.75;
	}
	.cond-notice code {
		font-size: 0.9em;
	}
	.empty {
		opacity: 0.6;
		font-style: italic;
		padding: 1rem 0;
	}
</style>
