<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import { IconCross, IconMenu, IconGlyph32Square } from '@stackoverflow/stacks-icons/icons'
	import { tick } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import type { TransitionConfig } from 'svelte/transition'

	import { chapterColour } from '$lib/constants'
	import Icon from '$lib/components/Icon.svelte'

	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce')

	let { year, chapters = [] }: { year: string; chapters?: { id: string; name: string; index: number }[] } = $props()

	let open = $state(false)
	let scrollY = $state(0)

	// The year index opens with BrandHeader, so the nav only carries the wordmark
	// once you have scrolled past it.
	const wordmark = $derived(page.route.id !== '/[year]' || scrollY > 500)

	const plain = 'border-black-150 dark:border-black-500'

	const links = $derived([
		{ href: resolve('/[year]', { year }), name: year, borderClass: plain },
		...chapters.map((chapter) => ({
			href: resolve('/[year]/[chapter]', { year, chapter: chapter.id }),
			name: chapter.name,
			borderClass: `border-${chapterColour(chapter.index).primary}`,
		})),
		{ href: resolve('/[year]/methodology', { year }), name: 'Methodology', borderClass: plain },
	])

	const wipe = (node: Element, { duration = 150, delay = 0 } = {}): TransitionConfig => ({
		delay: reducedMotion.current ? 0 : delay,
		duration: reducedMotion.current ? 0 : duration,
		easing: cubicOut,
		css: (t) => `transform: scaleX(${t})`,
	})

	let toggle = $state<HTMLButtonElement | null>(null)
	let list = $state<HTMLOListElement | null>(null)

	// `page.url.pathname` is safe here; only `search` and `searchParams` are
	// disabled during prerendering.
	const current = $derived(page.url.pathname)

	async function toggleOpen() {
		open = !open
		if (!open) return

		// The links stagger in, so they do not exist yet.
		await tick()
		list?.querySelector<HTMLAnchorElement>('a')?.focus()
	}

	function close({ focusToggle = false } = {}) {
		open = false
		if (focusToggle) toggle?.focus()
	}

	// Not a roving tabindex: the anchors stay natively focusable, so this degrades
	// to plain tabbing if it fails.
	function onListKeydown(event: KeyboardEvent) {
		const items = [...(list?.querySelectorAll<HTMLAnchorElement>('a') ?? [])]
		if (!items.length) return

		const at = items.indexOf(document.activeElement as HTMLAnchorElement)
		const go = (i: number) => {
			event.preventDefault()
			items[(i + items.length) % items.length].focus()
		}

		if (event.key === 'ArrowDown') go(at + 1)
		else if (event.key === 'ArrowUp') go(at - 1)
		else if (event.key === 'Home') go(0)
		else if (event.key === 'End') go(items.length - 1)
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') close({ focusToggle: true })
	}

	function onWindowPointerdown(event: PointerEvent) {
		const target = event.target
		if (open && (!(target instanceof Element) || !target.closest('[data-nav]'))) close()
	}
</script>

<svelte:window bind:scrollY onkeydown={onWindowKeydown} onpointerdown={onWindowPointerdown} />

<header class="vt-nav pointer-events-none fixed top-0 right-0 left-0 z-50 flex">
	{#if wordmark}
		<h1 class="origin-left leading-0" transition:wipe>
			<a class="pointer-events-auto inline-flex items-stretch leading-4" href={resolve('/[year]', { year })}>
				<span class="flex items-center bg-orange p-2 text-black"><Icon src={IconGlyph32Square} title="Stack Overflow" /></span>
				<span class="flex items-center bg-black px-4 text-white hover:bg-black-500">Developer Survey {year}</span>
			</a>
		</h1>
	{/if}

	<nav data-nav class="pointer-events-auto relative z-50 ml-auto w-auto text-white lg:w-1/2 lg:max-w-50" aria-label="Sections">
		<button
			bind:this={toggle}
			class="ml-auto flex h-12 cursor-pointer items-center justify-between gap-2 border-l-4 border-black-150 bg-black fill-current px-4 py-3 text-left text-sm font-semibold hover:bg-black-500 lg:w-full dark:border-black-500"
			aria-expanded={open}
			aria-controls="navigation-list"
			aria-label={open ? 'Close menu' : 'Open menu'}
			onclick={toggleOpen}
		>
			<!-- The text label is display:none below lg, which takes it out of the
			     accessibility tree — hence aria-label above. -->
			<span class="hidden lg:block">{open ? 'Close' : 'Menu'}</span>
			<Icon src={open ? IconCross : IconMenu} />
		</button>

		<ol bind:this={list} id="navigation-list" class="absolute top-full right-0 lg:w-full">
			{#each open ? links : [] as link, i (link.href)}
				<li class="origin-right" in:wipe={{ delay: i * 60 }} out:wipe={{ duration: 200, delay: (links.length - 1 - i) * 60 }}>
					<a
						class="block w-full border-l-4 bg-black {link.borderClass} px-4 py-2 aria-[current=page]:bg-black-500"
						href={link.href}
						aria-current={current === link.href ? 'page' : undefined}
						onclick={() => close()}
						onkeydown={onListKeydown}
					>
						{link.name}
					</a>
				</li>
			{/each}
		</ol>
	</nav>
</header>
