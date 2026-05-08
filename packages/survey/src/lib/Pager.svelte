<script lang="ts">
	import { onMount } from 'svelte'
	import { answers, reset, loadIndex, saveIndex } from '$lib/store/answers.svelte'
	import { visibleQuestions } from '$lib/data/show_if'
	import { flatten } from '$lib/data/flow'
	import { questions, survey } from '$lib/data/load'
	import type { Page as PageT } from '$lib/types'
	import Page from './Page.svelte'

	let index = $state(loadIndex())
	$effect(() => saveIndex(index))

	// Mirror the current page into the URL as `?q=<first-question-id>` so
	// browser back/forward works and links are shareable. URL takes priority
	// over sessionStorage on first load.
	function indexFromUrl(): number {
		const qid = new URLSearchParams(location.search).get('q')
		if (!qid) return -1
		return pages.findIndex((p) => p.questions.includes(qid))
	}
	function urlForIndex(i: number): string {
		const qid = pages[i]?.questions[0]
		const search = qid ? `?q=${encodeURIComponent(qid)}` : ''
		return `${location.pathname}${search}${location.hash}`
	}
	function navigate(newIndex: number, push = true) {
		if (newIndex < 0 || newIndex >= pages.length || newIndex === index) return
		index = newIndex
		const url = urlForIndex(newIndex)
		if (push) history.pushState({ index: newIndex }, '', url)
		else history.replaceState({ index: newIndex }, '', url)
	}

	onMount(() => {
		const fromUrl = indexFromUrl()
		if (fromUrl >= 0) index = fromUrl
		history.replaceState({ index }, '', urlForIndex(index))
		const onPop = () => {
			const i = indexFromUrl()
			if (i >= 0) index = i
		}
		addEventListener('popstate', onPop)
		return () => removeEventListener('popstate', onPop)
	})

	const pages = $derived<PageT[]>(flatten(survey.flow, questions, { respectRandomizerSubset: false }))

	// Live "is this page visible right now" — we still navigate through them all,
	// but pages whose condition is false render an empty state. (We could
	// auto-skip, but for a preview keeping them visible is more useful.)
	const current = $derived(pages[Math.min(index, Math.max(0, pages.length - 1))])
	const blockOrdinal = $derived.by(() => {
		const seen = new Set<string>()
		const order: string[] = []
		for (const p of pages) {
			if (!seen.has(p.block)) {
				seen.add(p.block)
				order.push(p.block)
			}
		}
		return { all: order, currentIdx: order.indexOf(current?.block ?? '') }
	})

	function next() {
		navigate(index + 1)
	}
	function back() {
		navigate(index - 1)
	}
	function jumpToQuestion(qid: string) {
		const i = pages.findIndex((p) => p.questions.includes(qid))
		if (i >= 0) navigate(i)
	}

	// Group pages by block so the page dropdown can show <optgroup>s and the
	// labels stay short ("question id, question id" rather than "Block: ids").
	const pageGroups = $derived.by(() => {
		const groups: { block: string; items: { i: number; label: string }[] }[] = []
		let current: (typeof groups)[number] | null = null
		pages.forEach((p, i) => {
			if (!current || current.block !== p.block) {
				current = { block: p.block, items: [] }
				groups.push(current)
			}
			current.items.push({ i, label: p.questions.join(', ') })
		})
		return groups
	})
	function resetAll() {
		reset()
		navigate(0)
	}

	const visibleCount = $derived(current ? visibleQuestions(current, answers, questions).length : 0)
</script>

<div class="preview-bar">
	<header class="progress">
		<span class="counts">
			Block {blockOrdinal.currentIdx + 1} / {blockOrdinal.all.length}
			· Page {index + 1} / {pages.length}
			·
			{visibleCount}
			{visibleCount === 1 ? 'question' : 'questions'}
		</span>
	</header>
	<label class="control">
		<select value={String(index)} onchange={(e) => navigate(Number((e.target as HTMLSelectElement).value))}>
			{#each pageGroups as g (g.block)}
				<optgroup label={g.block}>
					{#each g.items as item (item.i)}
						<option value={String(item.i)}>{item.i + 1}. {item.label}</option>
					{/each}
				</optgroup>
			{/each}
		</select>
	</label>
</div>

{#if current}
	<Page page={current} {questions} onJump={jumpToQuestion} />

	<footer class="nav">
		<div class="progress-bar" style:width={`${((index + 1) / Math.max(1, pages.length)) * 100}%`} aria-hidden="true"></div>
		<button type="button" onclick={back} disabled={index === 0}>← Back</button>
		<button type="button" onclick={resetAll}>Reset answers</button>
		<button type="button" class="primary" onclick={next} disabled={index >= pages.length - 1}> Next → </button>
	</footer>
{:else}
	<p>No pages — check survey.yaml.</p>
{/if}

<style>
	.preview-bar {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(127, 127, 127, 0.15);
		margin-bottom: 1rem;
		font-size: 0.85em;
	}
	.control {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}
	.control span {
		opacity: 0.7;
	}
	.progress {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0;
		font-size: 0.9em;
	}
	.counts {
		opacity: 0.7;
	}
	.nav {
		background: var(--bg);
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 1.25rem;
		margin-top: 1rem;
		border-top: 1px solid rgba(127, 127, 127, 0.2);
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
	}
	.progress-bar {
		position: absolute;
		top: 0;
		left: 0;
		height: 2px;
		background: var(--accent);
		transition: width 0.25s ease-out;
	}
	.nav button {
		padding: 0.55rem 1.2rem;
		font: inherit;
		border-radius: 0.3rem;
		border: 1px solid rgba(127, 127, 127, 0.4);
		background: transparent;
		cursor: pointer;
	}
	.nav button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.nav button.primary {
		background: var(--accent, #6962d6);
		color: white;
		border-color: var(--accent, #6962d6);
	}
	select {
		max-width: 16rem;
		padding: 0.3rem 0.5rem;
		font: inherit;
		border-radius: 0.3rem;
		border: 1px solid rgba(127, 127, 127, 0.4);
		background: transparent;
		cursor: pointer;
	}
</style>
