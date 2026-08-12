<script lang="ts">
	import { afterNavigate } from '$app/navigation'
	import { ModeWatcher, mode } from 'mode-watcher'

	import './layout.css'

	// https://stackoverflow.design/brand/typography
	import textFont from '$lib/assets/fonts/StackSansText[wght].woff2?url'
	import headlineFont from '$lib/assets/fonts/StackSansHeadline[wght].woff2?url'

	import Footer from '$lib/components/Footer.svelte'

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

	// The chapter-header view transition lands with the pages it animates between.
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
