<script lang="ts">
	import { IconCross } from '@stackoverflow/stacks-icons/icons'

	import { afterNavigate, goto } from '$app/navigation'
	import { page } from '$app/state'

	import QuestionPage from '../../routes/[year]/[chapter]/data/[question]/+page.svelte'
	import Icon from './Icon.svelte'

	const data = $derived(page.state.question)

	let dialog = $state<HTMLDialogElement>()

	// Matches the slide in the stylesheet below: the panel has to keep its content
	// until it is off screen.
	const SLIDE = 200

	afterNavigate((nav) => {
		if (nav.type === 'popstate' && page.state.question) void goto(location.href, { replaceState: true })
	})

	// The question the panel is drawing, which outlives `data` by the slide out.
	let shown = $state<any>(null)
	let clearing: ReturnType<typeof setTimeout> | undefined

	$effect(() => {
		clearTimeout(clearing)
		if (data) shown = data
		else if (shown) clearing = setTimeout(() => (shown = null), SLIDE)
	})

	// `showModal()` makes the page inert, not unscrollable. Held on the root rather
	// than the body, which carries a view-transition-name.
	$effect(() => {
		if (!shown) return

		const root = document.documentElement
		const was = root.style.overflow
		root.style.overflow = 'hidden'

		return () => (root.style.overflow = was)
	})

	// `show()`, not `showModal()`: a modal dialog is promoted to the top layer, where
	// it paints over the whole page and no z-index reaches it — including the header's.
	// What that gives up is put back by hand below.
	$effect(() => {
		if (!dialog) return
		if (data && !dialog.open) dialog.show()
		if (!data && dialog.open) dialog.close()
	})

	// showModal() moved focus into the dialog and sent it back on close. Held here so
	// the keyboard follows the panel and lands where it started.
	let returnTo: HTMLElement | null = null

	$effect(() => {
		if (!data || !dialog) return

		returnTo = document.activeElement as HTMLElement | null
		dialog.focus({ preventScroll: true })

		return () => returnTo?.focus({ preventScroll: true })
	})

	const close = () => history.back()

	// A modal dialog closes itself on Escape; this one is told to.
	function onWindowKeydown(event: KeyboardEvent) {
		if (data && event.key === 'Escape') close()
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<!-- The tint is a plain element, not `::backdrop`: the backdrop paints in the top
     layer, where nothing on the page can sit over it, and the wordmark has to. The
     backdrop is still there, transparent, and still what a click outside lands on. -->
<div class="tint fixed inset-0 z-40 bg-black/50 {data ? 'visible opacity-100' : 'invisible opacity-0'}" aria-hidden="true"></div>

<dialog
	bind:this={dialog}
	tabindex="-1"
	aria-modal="true"
	aria-label={shown ? `${shown.question.name}, ${shown.chapter.name}` : 'Question'}
	class="fixed top-0 right-0 bottom-0 left-auto z-45 m-0 h-dvh max-h-dvh w-full max-w-5xl overflow-y-auto overscroll-contain bg-white p-0 text-black dark:bg-black dark:text-white"
>
	{#if shown}
		<button
			type="button"
			onclick={close}
			class="fixed top-0 right-0 z-50 cursor-pointer bg-black p-3 text-white hover:bg-orange dark:bg-black-500 dark:hover:bg-orange dark:hover:text-black"
		>
			<span class="sr-only">Close</span>
			<Icon src={IconCross} />
		</button>

		<QuestionPage data={shown} panel />
	{/if}
</dialog>

<style>
	@media (prefers-reduced-motion: no-preference) {
		/* `display` is discrete, so without `allow-discrete` the panel is gone before
		   it can slide anywhere. */
		dialog {
			translate: 100% 0;
			transition:
				translate 200ms ease-out,
				display 200ms allow-discrete;
		}

		dialog[open] {
			translate: 0 0;
		}

		/* The state it opens *from*, rather than a keyframe, so the same declaration
		   runs backwards on the way out. */
		@starting-style {
			dialog[open] {
				translate: 100% 0;
			}
		}

		/* Visibility is held through the fade, so the tint is not hit-testable once gone. */
		.tint {
			transition:
				opacity 200ms ease-out,
				visibility 200ms;
		}
	}
</style>
