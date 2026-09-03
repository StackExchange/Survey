<script lang="ts">
	import { mode, ModeWatcher } from 'mode-watcher'

	import { afterNavigate, onNavigate } from '$app/navigation'

	import './layout.css'

	import headlineFont from '$lib/assets/fonts/StackSansHeadline.woff2?url'
	import textFont from '$lib/assets/fonts/StackSansText.woff2?url'

	import Footer from '$components/Footer.svelte'

	let { children } = $props()

	// Only on a real change: unconditionally would put a 250ms transition on first
	// paint and on every hover state.
	let shown = $state.raw<string | undefined>(undefined)
	let fading: ReturnType<typeof setTimeout> | undefined

	$effect(() => {
		const next = mode.current

		if (shown && shown !== next) {
			document.documentElement.classList.add('theme-fade')

			clearTimeout(fading)
			// Matches the transition duration in layout.css.
			fading = setTimeout(() => document.documentElement.classList.remove('theme-fade'), 250)
		}

		shown = next
	})

	// Only when there is no hash: SvelteKit defers its own focus reset for a
	// fragment link, so an in-page link would land on <main> instead of its target.
	afterNavigate(({ to }) => {
		if (to?.url.hash) return
		document.getElementById('main')?.focus({ preventScroll: true })
	})

	// https://svelte.dev/blog/view-transitions
	const headerHeight = () => `${Math.floor(document.querySelector('.vt-chapter-header')?.getBoundingClientRect().height ?? 0)}px`

	onNavigate((navigation) => {
		if (!document.startViewTransition) return

		const root = document.documentElement

		const from = headerHeight()
		root.style.setProperty('--page-header-from', from)

		// Keeps the outgoing snapshot in sync with the new incoming page
		if (!navigation.to?.url.hash) {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
		}

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve()
				await navigation.complete

				const to = headerHeight()
				root.style.setProperty('--page-header-to', to)

				root.classList.toggle('vt-swap-header', from !== '0px' && to !== '0px')
			})
		})
	})
</script>

<ModeWatcher disableTransitions={false} />

<svelte:head>
	<link rel="preload" href={textFont} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={headlineFont} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<a
	class="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-100 focus:bg-black focus:px-4 focus:py-3 focus:text-white"
	href="#main"
>
	Skip to content
</a>

{@render children()}

<Footer />
