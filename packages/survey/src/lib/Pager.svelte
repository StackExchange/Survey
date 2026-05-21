<script lang="ts">
	import { onMount } from 'svelte'
	import { reset } from '$lib/store/answers.svelte'
	import { questions } from '$lib/data/load'
	import { jumpToQuestion, nav, navigate, pageAnchorId, pages, setCurrentIndex } from '$lib/store/nav.svelte'
	import Page from './Page.svelte'

	let listEl: HTMLElement | undefined = $state()

	onMount(() => {
		if (!listEl) return

		// Watch every page section. As the user scrolls, whichever has the
		// highest intersection ratio becomes `nav.index`. `rootMargin` biases
		// "current" toward the section at the top of the viewport rather than
		// the geometric middle — feels right for top-down reading.
		const observer = new IntersectionObserver(
			(entries) => {
				let best: { i: number; ratio: number } | null = null
				for (const e of entries) {
					if (!e.isIntersecting) continue
					const i = Number((e.target as HTMLElement).dataset.pageIndex)
					if (!best || e.intersectionRatio > best.ratio) {
						best = { i, ratio: e.intersectionRatio }
					}
				}
				if (best) setCurrentIndex(best.i)
			},
			{ rootMargin: '-25% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
		)
		listEl.querySelectorAll<HTMLElement>('section[data-page-index]').forEach((s) => observer.observe(s))

		// Browser handles initial hash scroll natively, but doing it again on
		// next frame gives layout a chance to settle (web-fonts etc).
		if (location.hash) {
			requestAnimationFrame(() => {
				document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' })
			})
		}

		return () => observer.disconnect()
	})

	function resetAll() {
		reset()
		navigate(0)
	}
</script>

<div class="progress-wrap" aria-hidden="true">
	<div class="progress-bar" style:width={`${((nav.index + 1) / Math.max(1, pages.length)) * 100}%`}></div>
</div>

<div class="pages-list" bind:this={listEl}>
	{#each pages as p, i (i)}
		<section id={pageAnchorId(p)} data-page-index={i} class="page-section">
			<Page page={p} {questions} onJump={jumpToQuestion} pageNumber={i + 1} />
		</section>
	{/each}
</div>

<footer class="nav">
	<div class="logo">
		<svg width="32" height="32" viewBox="0 0 32 32" class="svg-icon IconGlyph32" aria-hidden="true"
			><path
				d="m23.8 17.23.04.02v.01za17.6 17.6 0 0 0-3.36 8.23v.02a18 18 0 0 0-.05 4.53H4.01v-4.55h14.23q.03-.28.09-.56L4.62 21.1l1.14-4.39 13.88 3.84.2-.44L7.37 12.7l2.2-3.94 12.64 7.53.3-.37L12.18 5.23 15.3 2 25.8 12.87l1.11 1.15q-1.76 1.39-3.12 3.2"
			/></svg
		>
		<h1>Developer Survey Preview</h1>
	</div>

	<div class="actions">
		<button type="button" onclick={resetAll}>Reset</button>
	</div>
</footer>

<style>
	.pages-list {
		display: flex;
		flex-direction: column;
	}
	.page-section {
		scroll-margin-top: 1rem;
		margin-block: 1.5rem;
	}
	.page-section:first-child {
		margin-block-start: 0;
	}

	.nav,
	.progress-wrap {
		position: fixed;
		left: 0; right: 0;
		z-index: 1000;
		width: 100%;
		box-sizing: border-box;
	}
	.nav {
		top: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1.5rem;
	}
	.nav h1 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-h);
	}
	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.progress-wrap {
		top: 0;
		height: 2px;
		overflow: hidden;
	}
	.progress-bar {
		height: 100%;
		background: var(--accent);
		transition: width 0.25s ease-out;
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
		background: var(--bg-page);
	}
	.nav button:hover {
    opacity: 0.8;
	}
</style>
