<script lang="ts">
	import type { TransitionConfig } from 'svelte/transition'

	import { IconCross, IconGlyph32Square, IconMenu } from '@stackoverflow/stacks-icons/icons'
	import { tick } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import { MediaQuery } from 'svelte/reactivity'

	import { resolve } from '$app/paths'
	import { page } from '$app/state'

	import { chapterColour } from '$config'

	import Icon from '$components/Icon.svelte'

	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce')

	let { year, chapters = [] }: { year: string; chapters?: { id: string; name: string; index: number }[] } = $props()

	let open = $state(false)
	let scrollY = $state(0)

	// BrandHeader which has the logo for the index
	const wordmark = $derived(page.route.id !== '/[year]' || scrollY > 500)

	// Layering the nav when QuestionPanel.svelte is open
	const panelled = $derived(Boolean(page.state.question))

	$effect(() => {
		if (panelled) open = false
	})

	const plain = 'border-black-150 dark:border-black-500'

	// On a data page the chapter links stay in the data section, otherwise they go to the chapter overview.
	const deep = $derived(page.route.id?.startsWith('/[year]/[chapter]/data') ?? false)

	const links = $derived([
		{ href: resolve('/[year]', { year }), name: year, borderClass: plain, exact: true },
		...chapters.map((chapter) => ({
			href: deep
				? resolve('/[year]/[chapter]/data', { year, chapter: chapter.id })
				: resolve('/[year]/[chapter]', { year, chapter: chapter.id }),
			name: chapter.name,
			borderClass: chapterColour(chapter.index).border,
			exact: false,
		})),
		{ href: resolve('/[year]/methodology', { year }), name: 'Methodology', borderClass: plain, exact: true },
	])

	const wipe = (node: Element, { duration = 150, delay = 0 } = {}): TransitionConfig => ({
		delay: reducedMotion.current ? 0 : delay,
		duration: reducedMotion.current ? 0 : duration,
		easing: cubicOut,
		css: (t) => `transform: scaleX(${t})`,
	})

	let toggle = $state<HTMLButtonElement | null>(null)
	let list = $state<HTMLOListElement | null>(null)

	const current = $derived(page.url.pathname)

	// A single question page still counts as its chapter's data page.
	const isCurrent = (link: { href: string; exact: boolean }) =>
		link.exact ? current === link.href : current === link.href || current.startsWith(`${link.href}/`)

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

	// Keyboard nav: esc and up/down arrows
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
		<p class="origin-left leading-0" transition:wipe>
			<a class="pointer-events-auto inline-flex items-stretch leading-4" href={resolve('/[year]', { year })}>
				<span class="flex items-center bg-orange p-2 text-black"><Icon src={IconGlyph32Square} title="Stack Overflow" /></span>
				<span class="flex items-center bg-black px-4 text-white hover:bg-black-500">Developer Survey {year}</span>
			</a>
		</p>
	{/if}

	<nav
		data-nav
		class="pointer-events-auto relative z-50 ml-auto w-auto text-white transition-[opacity,visibility] duration-200 lg:w-1/2 lg:max-w-50 {panelled
			? 'invisible opacity-0'
			: 'visible opacity-100'}"
		aria-label="Sections"
	>
		<button
			bind:this={toggle}
			class="ml-auto flex h-12 cursor-pointer items-center justify-between gap-2 border-l-4 border-black-150 bg-black fill-current px-4 py-3 text-left text-sm font-semibold hover:bg-black-500 lg:w-full dark:border-black-500"
			aria-expanded={open}
			aria-controls="navigation-list"
			aria-label={open ? 'Close menu' : 'Open menu'}
			onclick={toggleOpen}
		>
			<span class="hidden lg:block">{open ? 'Close' : 'Menu'}</span>
			<Icon src={open ? IconCross : IconMenu} />
		</button>

		<ol bind:this={list} id="navigation-list" class="absolute top-full right-0 lg:w-full">
			{#each open ? links : [] as link, i (link.href)}
				<li class="origin-right" in:wipe={{ delay: i * 60 }} out:wipe={{ duration: 200, delay: (links.length - 1 - i) * 60 }}>
					<a
						class="block w-full border-l-4 bg-black {link.borderClass} px-4 py-2 hover:bg-black-500 aria-[current=page]:bg-black-500 aria-[current=page]:font-bold"
						href={link.href}
						aria-current={isCurrent(link) ? 'page' : undefined}
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
