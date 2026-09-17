<script lang="ts">
	import { IconCross } from '@stackoverflow/stacks-icons/icons'

	import { afterNavigate, goto } from '$app/navigation'
	import { page } from '$app/state'

	import QuestionPage from '../../routes/[year]/[chapter]/data/[question]/+page.svelte'
	import Icon from './Icon.svelte'

	const data = $derived(page.state.question)

	let dialog = $state<HTMLDialogElement>()

	const SLIDE = 200

	afterNavigate((nav) => {
		if (nav.type === 'popstate' && page.state.question) void goto(location.href, { replaceState: true })
	})

	let shown = $state<any>(null)
	let clearing: ReturnType<typeof setTimeout> | undefined

	$effect(() => {
		clearTimeout(clearing)
		if (data) shown = data
		else if (shown) clearing = setTimeout(() => (shown = null), SLIDE)
	})

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

<div
	onclick={close}
	class="tint fixed inset-0 z-40 bg-black/50 dark:bg-white/10 {data ? 'visible opacity-100' : 'invisible opacity-0'}"
	style="backdrop-filter:grayscale(1)"
	aria-hidden="true"
></div>

<dialog
	bind:this={dialog}
	tabindex="-1"
	aria-modal="true"
	aria-label={shown ? `${shown.question.name}, ${shown.chapter.name}` : 'Question'}
	class="fixed top-0 right-0 bottom-0 left-auto z-45 m-0 h-dvh max-h-dvh w-full max-w-5xl overflow-y-auto overscroll-contain bg-white p-0 text-black dark:bg-black dark:text-white"
>
	{#if shown}
		<div class="sticky top-0 right-0 z-10 h-0 text-right">
			<button
				type="button"
				onclick={close}
				class="z-50 cursor-pointer bg-black p-3 text-white hover:bg-orange dark:bg-black-500 dark:hover:bg-orange dark:hover:text-black"
			>
				<span class="sr-only">Close</span>
				<Icon src={IconCross} />
			</button>
		</div>

		<QuestionPage data={shown} panel />
	{/if}
</dialog>

<style>
	@media (prefers-reduced-motion: no-preference) {
		dialog {
			translate: 100% 0;
			transition:
				translate 200ms ease-out,
				display 200ms allow-discrete;
		}

		/* `none`, not `0 0`: an identity translate still makes this dialog a containing
		   block for `position: fixed` descendants, which lands the charts' pointer-
		   positioned tooltips ~700px to the right. At rest there is no transform at all. */
		dialog[open] {
			translate: none;
		}

		@starting-style {
			dialog[open] {
				translate: 100% 0;
			}
		}

		.tint {
			transition:
				opacity 200ms ease-out,
				visibility 200ms;
		}
	}
</style>
