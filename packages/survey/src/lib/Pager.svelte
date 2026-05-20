<script lang="ts">
	import { onMount } from 'svelte'
	import { answers, reset } from '$lib/store/answers.svelte'
	import { visibleQuestions } from '$lib/data/show_if'
	import { questions } from '$lib/data/load'
	import { canonicaliseUrl, jumpToQuestion, nav, navigate, pages, subscribePopState } from '$lib/store/nav.svelte'
	import Page from './Page.svelte'

	const current = $derived(pages[Math.min(nav.index, Math.max(0, pages.length - 1))])
	const visibleCount = $derived(current ? visibleQuestions(current, answers, questions).length : 0)

	onMount(() => {
		canonicaliseUrl()
		return subscribePopState()
	})

	function next() {
		navigate(nav.index + 1)
	}
	function back() {
		navigate(nav.index - 1)
	}
	function resetAll() {
		reset()
		navigate(0)
	}
</script>

{#if current}
	<Page page={current} {questions} onJump={jumpToQuestion} />

	<div class="progress-wrap" aria-hidden="true">
		<div class="progress-bar" style:width={`${((nav.index + 1) / Math.max(1, pages.length)) * 100}%`}></div>
	</div>

	<footer class="nav">
	  <h1>Developer Survey Preview</h1>

		<span class="counts">
			Page {nav.index + 1} / {pages.length}
			·
			{visibleCount}
			{visibleCount === 1 ? 'question' : 'questions'} visible
		</span>

		<div class="actions">
			<button type="button" onclick={back} disabled={nav.index === 0}>←</button>
			<button type="button" onclick={resetAll}>Reset</button>
			<button type="button" class="primary" onclick={next} disabled={nav.index >= pages.length - 1}>→</button>
		</div>
	</footer>
{:else}
	<p>No pages — check survey.yaml.</p>
{/if}

<style>
	/* Footer + progress bar are pinned to the bottom/top of the *main column*
	   (66% of the viewport), not the full viewport — the mini-map occupies the
	   right 33% and we don't want either bar sliding under it. */
	.nav {
		position: fixed;
		left: 0;
		width: 66%;
		box-sizing: border-box;
	}
	.nav {
		bottom: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1.5rem;
		background: var(--bg);
	}
	.nav h1 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-h);
	}
	.progress-wrap {
		top: 0;
		height: 2px;
		overflow: hidden;
		position: absolute;
	}
	.progress-bar {
		height: 100%;
		background: var(--accent);
		transition: width 0.25s ease-out;
	}

	.counts {
		opacity: 0.7;
		font-size: 0.85em;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
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
</style>
