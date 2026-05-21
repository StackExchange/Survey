<script lang="ts">
	import { answers } from '$lib/store/answers.svelte'
	import { evaluate, visibleQuestions } from '$lib/data/show_if'
	import { tokenizeShowIf, type ShowIfToken } from '$lib/data/format_show_if'
	import type { Page, Question, ShowIf } from '$lib/types'
	import QuestionView from '$lib/components/Question.svelte'
	import ShowIfTokens from './ShowIfTokens.svelte'

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

	const visible = $derived(visibleQuestions(page, answers, questions))

	// Always show every (non-deprecated, known) question on the page so the
	// structure stays inspectable; gated ones get a per-question condition
	// notice + dim when hidden.
	const renderIds = $derived(page.questions.filter((id) => questions[id] && !questions[id].deprecated))

	interface CondRow {
		label: string
		tokens: ShowIfToken[]
	}

	function conditionsFor(id: string): CondRow[] {
		const q = questions[id]
		if (!q) return []
		const rows: CondRow[] = []
		if (page.condition) {
			rows.push({ label: 'branch', tokens: tokenizeShowIf(page.condition as ShowIf) })
		}
		if (q.show_if) {
			rows.push({ label: 'show_if', tokens: tokenizeShowIf(q.show_if) })
		}
		return rows
	}
</script>

<div class="page">
	{#if pageNumber !== undefined}
		<div class="page-tab" aria-hidden="true">{String(pageNumber).padStart(2, '0')}</div>
	{/if}

	{#each renderIds as id (id)}
		{#if questions[id]}
			{@const hidden = !visible.includes(id)}
			{@const conds = conditionsFor(id)}

			<div class="slot" class:dimmed={hidden}>
				{#if conds.length > 0}
					<aside class="cond-notice" class:hidden class:shown={!hidden} aria-label={hidden ? 'Hidden question' : 'Conditional question'}>
						<span class="tag">{hidden ? 'Hidden' : 'Shown'}</span>
						<span class="hint">{hidden ? 'requires' : 'because'}</span>
						<ul class="cond-list">
							{#each conds as c}
								<li>
									<span class="cond-label">{c.label}:</span>
									<code><ShowIfTokens tokens={c.tokens} {onJump} /></code>
								</li>
							{/each}
						</ul>
					</aside>
				{/if}

				<QuestionView question={questions[id]} />
			</div>
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
	.slot {
		display: flex;
		flex-direction: column;
	}
	.slot.dimmed :global(.q) {
		opacity: 0.55;
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
		border-color: rgba(34, 139, 34, 0.4);
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
	.cond-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	.cond-list li {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
	.cond-label {
		opacity: 0.6;
		font-size: 0.85em;
	}
	.cond-list code {
		font-size: 0.9em;
	}
	.empty {
		opacity: 0.6;
		font-style: italic;
		padding: 1rem 0;
	}
</style>
