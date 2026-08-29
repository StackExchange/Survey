<script lang="ts">
	import type { Attachment } from 'svelte/attachments'

	import { IconArrowLeft, IconArrowRight } from '@stackoverflow/stacks-icons/icons'

	import Icon from '$components/Icon.svelte'

	interface Props {
		href: string
		spot: string
		title: string
		subtitle: string
		direction?: 'forward' | 'back'
	}

	let { href, spot, title, subtitle, direction = 'forward' }: Props = $props()

	const arrow = $derived(direction === 'back' ? IconArrowLeft : IconArrowRight)

	let scrollY = $state(0)
	let innerHeight = $state(0)

	const starting = $derived(scrollY < innerHeight / 2)
	let resting = $state(false)
	let held = $state(false)
	const open = $derived(starting || resting || held)

	const foot: Attachment<HTMLElement> = (node) => {
		if (typeof IntersectionObserver === 'undefined') {
			resting = true
			return
		}

		const observer = new IntersectionObserver(([entry]) => (resting = entry.isIntersecting))

		observer.observe(node)

		return () => observer.disconnect()
	}
</script>

<svelte:window bind:scrollY bind:innerHeight />

<a
	{href}
	data-open={open}
	onpointerenter={() => (held = true)}
	onpointerleave={() => (held = false)}
	onfocus={() => (held = true)}
	onblur={() => (held = false)}
	class="jump sticky bottom-5 float-right mr-5 ml-auto inline-flex max-w-100 bg-black leading-snug hover:bg-orange-medium lg:w-full dark:bg-orange-medium dark:hover:bg-orange-dark"
>
	<Icon src={spot} class="native hidden h-auto max-w-30 p-3 lg:block" />

	<div class="flex-1 p-0 leading-tight text-white lg:p-4">
		<div class="px-3 pt-2 font-semibold lg:mb-1 lg:p-0">{title}</div>
		<div class="hidden opacity-50 md:block">{subtitle}</div>
	</div>

	<div class="arrow static right-0 bottom-0 flex bg-orange p-2 text-black md:absolute">
		<Icon src={arrow} class="mt-auto" />
	</div>
</a>

<div aria-hidden="true" class="h-30" {@attach foot}></div>

<style>
	.jump {
		--arrow: 2.25rem;

		clip-path: inset(0);
	}

	.jump[data-open='false'] {
		clip-path: inset(calc(100% - var(--arrow)) 0 0 calc(100% - var(--arrow)));
	}

	@media (prefers-reduced-motion: no-preference) {
		.jump {
			transition: clip-path 300ms ease;
		}
	}
</style>
