<script lang="ts">
	import { page } from '$app/state'
	import { IconCross } from '@stackoverflow/stacks-icons/icons'

	import Icon from './Icon.svelte'
	import QuestionPage from '../../routes/[year]/[chapter]/data/[question]/+page.svelte'

	// `<dialog>` rather than a div: backdrop, Escape, focus trap and inert
	// background all come with it.
	const data = $derived(page.state.question)

	let dialog = $state<HTMLDialogElement>()

	$effect(() => {
		if (!dialog) return
		if (data && !dialog.open) dialog.showModal()
		if (!data && dialog.open) dialog.close()
	})

	// Opening pushed a history entry, so back is what restores the URL. Closing the
	// dialog directly would strand it.
	const close = () => history.back()
</script>

<dialog
	bind:this={dialog}
	aria-label={data ? `${data.question.name}, ${data.chapter.name}` : 'Question'}
	class="fixed top-0 right-0 bottom-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-5xl overflow-y-auto bg-white p-0 text-black backdrop:bg-black/50 dark:bg-black dark:text-white"
	oncancel={(event) => {
		event.preventDefault()
		close()
	}}
	onclick={(event) => {
		if (event.target === dialog) close()
	}}
>
	{#if data}
		<button
			type="button"
			onclick={close}
			class="fixed top-0 right-0 z-50 bg-black-150 p-3 hover:bg-orange dark:bg-black-500 dark:hover:bg-orange dark:hover:text-black"
		>
			<span class="sr-only">Close</span>
			<Icon src={IconCross} />
		</button>

		<QuestionPage {data} panel />
	{/if}
</dialog>

<style>
	@media (prefers-reduced-motion: no-preference) {
		dialog[open] {
			animation: slide-in 200ms ease-out;
		}

		dialog[open]::backdrop {
			animation: fade-in 200ms ease-out;
		}
	}

	@keyframes slide-in {
		from {
			translate: 100% 0;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
</style>
