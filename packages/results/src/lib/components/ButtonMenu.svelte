<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { ClassValue } from 'svelte/elements'

	import { IconChevronDown, IconChevronUp } from '@stackoverflow/stacks-icons/icons'
	import clsx from 'clsx'
	import { tick } from 'svelte'

	import Button from './Button.svelte'

	export type MenuItem = { name: string; href?: string; onclick?: () => void; icon?: string; external?: boolean }

	let {
		items,
		label = 'More options',
		action,
		class: className,
		menuClass = 'right-0 lg:right-auto lg:left-0',
	}: {
		items: MenuItem[]
		label?: string
		// The other half of a split button. Without it, the toggle stands alone.
		action?: Snippet
		class?: ClassValue
		menuClass?: ClassValue
	} = $props()

	const id = $props.id()

	let open = $state(false)
	let root = $state<HTMLElement | null>(null)
	let toggle = $state<HTMLElement | null>(null)
	let menu = $state<HTMLElement | null>(null)

	async function openMenu() {
		open = !open
		if (!open) return

		await tick()
		menu?.querySelector<HTMLElement>('[data-menu-item]')?.focus()
	}

	function close({ focusToggle = false } = {}) {
		open = false
		if (focusToggle) toggle?.focus()
	}

	// The items are natively focusable, so arrow keys are an addition.
	function onItemKeydown(event: KeyboardEvent) {
		const found = [...(menu?.querySelectorAll<HTMLElement>('[data-menu-item]') ?? [])]
		if (!found.length) return

		const at = found.indexOf(document.activeElement as HTMLElement)
		const go = (i: number) => {
			event.preventDefault()
			found[(i + found.length) % found.length].focus()
		}

		if (event.key === 'ArrowDown') go(at + 1)
		else if (event.key === 'ArrowUp') go(at - 1)
		else if (event.key === 'Home') go(0)
		else if (event.key === 'End') go(found.length - 1)
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') close({ focusToggle: true })
	}

	function onWindowPointerdown(event: PointerEvent) {
		const target = event.target
		if (open && (!(target instanceof Node) || !root?.contains(target))) close()
	}
</script>

<svelte:window onkeydown={onWindowKeydown} onpointerdown={onWindowPointerdown} />

<div bind:this={root} class={clsx('relative inline-flex', className)}>
	{@render action?.()}

	<Button
		bind:element={toggle}
		variant="filled"
		size="icon"
		icon={open ? IconChevronUp : IconChevronDown}
		title={open ? `Close ${label.toLowerCase()}` : label}
		aria-expanded={open}
		aria-controls={id}
		onclick={openMenu}
	/>

	<div
		bind:this={menu}
		{id}
		class={clsx(
			'absolute top-full z-50 -mt-px min-w-55 border bg-black-150 dark:border-black-500 dark:bg-black',
			menuClass,
			open || 'hidden'
		)}
	>
		{#each items as item (item.name)}
			<Button
				variant="plain"
				class="w-full justify-start"
				label={item.name}
				icon={item.icon}
				href={item.href}
				external={item.external}
				data-menu-item
				onkeydown={onItemKeydown}
				onclick={() => {
					item.onclick?.()
					close()
				}}
			/>
		{/each}
	</div>
</div>
