<script lang="ts">
	import { survey, questions } from '$lib/data/load'
	import { tokenizeShowIf } from '$lib/data/format_show_if'
	import { evaluate } from '$lib/data/show_if'
	import { answers } from '$lib/store/answers.svelte'
	import { nav, navigate, pages } from '$lib/store/nav.svelte'
	import type { FlowElement, PageEntry, ShowIf } from '$lib/types'
	import ShowIfTokens from './ShowIfTokens.svelte'

	// Map question id -> flat page index, for navigation + the visible
	// page number on the first question of each page.
	const pageIndexByQid = $derived.by(() => {
		const m = new Map<string, number>()
		pages.forEach((p, i) => p.questions.forEach((q) => m.set(q, i)))
		return m
	})

	function visibleIds(entry: string | string[]): string[] {
		const ids = Array.isArray(entry) ? entry : [entry]
		return ids.filter((id) => {
			const q = questions[id]
			return q && !q.deprecated
		})
	}

	function handleJump(qid: string) {
		const i = pages.findIndex((p) => p.questions.includes(qid))
		if (i >= 0) navigate(i)
	}
</script>

{#snippet flowList(elements: FlowElement[], gateOpen: boolean)}
	<ol class="tree">
		{#each elements as el, i (i)}
			{#if 'block' in el}
				<li class="block">
					<span class="block-label">{el.block}</span>
					{@render pagesList(el.pages as PageEntry[], gateOpen)}
				</li>
			{:else if 'randomize' in el}
				<li class="randomizer">
					<span class="randomizer-label">Randomize {el.randomize}</span>
					{@render flowList(el.blocks, gateOpen)}
				</li>
			{:else if 'if' in el}
				{@const cond = el.if as ShowIf}
				{@const open = gateOpen && evaluate(cond, answers, questions)}
				<li class="branch {open ? 'open' : 'closed'}">
					<div class="branch-row">
						<span class="branch-cond"><ShowIfTokens tokens={tokenizeShowIf(cond)} onJump={handleJump} /></span>
					</div>
					{@render flowList(el.then, open)}
				</li>
			{/if}
		{/each}
	</ol>
{/snippet}

{#snippet pagesList(entries: PageEntry[], gateOpen: boolean)}
	<ol class="tree">
		{#each entries as entry, i (i)}
			{#if typeof entry === 'string' || Array.isArray(entry)}
				{@const ids = visibleIds(entry)}
				{#if ids.length > 0}
					{@const pi = pageIndexByQid.get(ids[0])}
					{@const onlyShowIf = ids.length === 1 ? questions[ids[0]]?.show_if : undefined}
					{#if onlyShowIf}
						{@const open = gateOpen && evaluate(onlyShowIf, answers, questions)}
						<li class="branch {open ? 'open' : 'closed'}">
							<div class="branch-row">
								<span class="branch-cond"><ShowIfTokens tokens={tokenizeShowIf(onlyShowIf)} onJump={handleJump} /></span>
							</div>
							<ol class="tree">
								<li class="page">
									{@render pageContent(ids, pi, open, true)}
								</li>
							</ol>
						</li>
					{:else}
						<li class="page">
							{@render pageContent(ids, pi, gateOpen, false)}
						</li>
					{/if}
				{/if}
			{:else}
				{@const cond = entry.if as ShowIf}
				{@const open = gateOpen && evaluate(cond, answers, questions)}
				<li class="branch {open ? 'open' : 'closed'}">
					<div class="branch-row">
						<span class="branch-cond"><ShowIfTokens tokens={tokenizeShowIf(cond)} onJump={handleJump} /></span>
					</div>
					{@render pagesList(entry.then as PageEntry[], open)}
				</li>
			{/if}
		{/each}
	</ol>
{/snippet}

{#snippet pageContent(ids: string[], pageIndex: number | undefined, gateOpen: boolean, gateHoisted: boolean)}
	{@const gates = gateHoisted
		? []
		: ids.map((qid) => ({ qid, expr: questions[qid]?.show_if })).filter((g): g is { qid: string; expr: ShowIf } => !!g.expr)}
	{@const anyGateFails = gates.some((g) => !evaluate(g.expr, answers, questions))}
	{@const state = !gateOpen || anyGateFails ? 'closed' : gates.length > 0 ? 'open' : ''}
	{#snippet questionBtn()}
		<button
			type="button"
			class="question-btn"
			class:current={pageIndex !== undefined && nav.index === pageIndex}
			onclick={() => pageIndex !== undefined && navigate(pageIndex)}
			title={pageIndex !== undefined ? `Page ${pageIndex + 1}` : undefined}
		>
			<span class="page-idx" aria-hidden="true">
				{pageIndex !== undefined ? String(pageIndex + 1).padStart(2, '0') : ''}
			</span>
			<span class="question-qid">{ids.join(', ')}</span>
		</button>
	{/snippet}
	<div class="q {state}">
		{#if gates.length > 0}
			{#each gates as g (g.qid)}
				<div class="branch question-gate">
					<div class="branch-row">
						<span class="branch-cond"><ShowIfTokens tokens={tokenizeShowIf(g.expr)} onJump={handleJump} /></span>
					</div>
				</div>
			{/each}
			<div class="tree">{@render questionBtn()}</div>
		{:else}
			{@render questionBtn()}
		{/if}
	</div>
{/snippet}

<aside class="mini-map" aria-label="Survey flow">
	{@render flowList(survey.flow, true)}
</aside>

<style>
	.mini-map {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 30%;
		max-height: 100vh;
		overflow-y: auto;
		padding: 1rem;
		font-size: 0.85em;
	}

	.tree {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.tree .tree {
		margin-inline-start: 0.4rem;
		padding-inline-start: 0.5rem;
		border-inline-start: 1px solid var(--border);
	}
	li {
		padding-block: 0.05rem;
	}

	.block {
		margin-top: 0.6rem;
	}
	.block-label {
		font-size: 1.2rem;
		margin: 0 0 10px 0;
		color: var(--text-h);
		display: block;
	}

	.randomizer-label {
	  margin-top: 10px;
		opacity: 0.75;
		font-style: italic;
		display: block;
	}

	.branch.open > .branch-row,
	.q.open .branch > .branch-row {
		color: var(--shown);
	}
	.open > .tree {
		border-inline-start-color: var(--shown);
	}
	.branch.closed > .branch-row,
	.q.closed .branch > .branch-row {
		color: var(--hidden);
	}
	.q.closed .question-btn {
	  opacity: 0.4;
		cursor: not-allowed;
	}
	.closed > .tree {
		border-inline-start-color: var(--hidden);
	}
	.branch-cond {
		font-family: var(--mono);
		line-height: 1.3;
	}

	.branch-row {
		display: inline-flex;
		align-items: baseline;
		padding: 0 0 5px 0.8rem;
		font-size: 0.7rem;
		margin: 0 0 0 0.4rem;
    border-left: 1px solid;
	}

	.question-btn {
		all: unset;
		display: flex;
		align-items: baseline;
		gap: 0.3rem;
		width: 100%;
		padding: 0.15rem 0.4rem 0.15rem 0;
		cursor: pointer;
		font: inherit;
		color: inherit;
		text-align: start;
		box-sizing: border-box;
	}
	.question-btn:hover {
		background: rgba(127, 127, 127, 0.08);
	}
	.question-btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.question-btn.current {
		background: var(--text-h);
		color: var(--bg-page);
		font-weight: 600;
	}

	.page-idx {
		font-variant-numeric: tabular-nums;
		opacity: 0.55;
		flex-shrink: 0;
		min-width: 1.6em;
		text-align: end;
	}
	.question-qid {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

</style>
