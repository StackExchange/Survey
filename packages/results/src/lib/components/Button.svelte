<script lang="ts">
	import { IconCheckFillSquare } from '@stackoverflow/stacks-icons/icons'
	import clsx from 'clsx'

	import { write } from '$lib/clipboard'

	import Icon from './Icon.svelte'

	import type { CopyStatus } from '$lib/clipboard'
	import type { Snippet } from 'svelte'
	import type { ClassValue, HTMLAttributes, MouseEventHandler } from 'svelte/elements'

	// `label` is a string so a copy button can swap it for "Copied"; anything
	// richer goes in the default snippet instead.
	let {
		label,
		children,
		href,
		external = false,
		rel,
		icon,
		iconEnd,
		copy,
		variant = 'outline',
		size,
		title,
		element = $bindable(null),
		class: className,
		onclick,
		...rest
	}: {
		label?: string
		children?: Snippet
		// Renders an <a> rather than a <button>.
		href?: string
		external?: boolean
		rel?: string
		// Raw SVG from stacks-icons, leading and trailing.
		icon?: string
		iconEnd?: string
		// A string, or something that goes and gets one — a fetch, say.
		copy?: string | (() => string | Promise<string>)
		variant?: keyof typeof variants
		size?: keyof typeof sizes
		title?: string
		element?: HTMLElement | null
		class?: ClassValue
	} & HTMLAttributes<HTMLElement> = $props()

	const variants = {
		outline: 'border hover:border-black hover:bg-black hover:text-white dark:hover:bg-black-600',
		// The ground stays light in both themes, so the ink has to be stated.
		filled: 'bg-black-200 text-black hover:bg-black hover:text-white dark:hover:bg-black-600',
		plain: 'hover:bg-black hover:text-white dark:hover:bg-black-600',
		link: 'underline underline-offset-2 hover:text-orange',
	}

	const sizes = { md: 'px-3 py-2', icon: 'p-2', none: '' }

	const padding = $derived(sizes[size ?? (variant === 'link' ? 'none' : 'md')])

	let status = $state<CopyStatus>('idle')
	let clearing: ReturnType<typeof setTimeout> | undefined

	async function runCopy() {
		let ok = false

		try {
			ok = await write(typeof copy === 'function' ? await copy() : (copy ?? ''))
		} catch (error) {
			console.error('copy:', error)
		}

		status = ok ? 'copied' : 'failed'

		clearTimeout(clearing)
		clearing = setTimeout(() => (status = 'idle'), 2000)
	}

	const activate: MouseEventHandler<HTMLElement> = (event) => {
		onclick?.(event)
		if (copy) runCopy()
	}

	const said = $derived(copy ? { idle: label ?? title ?? 'Copy', copied: 'Copied', failed: 'Copy failed' }[status] : label)

	// Reserves room for the longest state, so the button doesn't resize mid-click.
	const widest = $derived([label ?? '', 'Copied', 'Copy failed'].reduce((a, b) => (b.length > a.length ? b : a)))
</script>

<svelte:element
	this={href ? 'a' : 'button'}
	bind:this={element}
	{href}
	{title}
	type={href ? undefined : 'button'}
	target={external ? '_blank' : undefined}
	rel={rel ?? (external ? 'noopener' : undefined)}
	aria-label={label || children ? undefined : title}
	class={clsx('inline-flex cursor-pointer items-center gap-2 text-sm', variants[variant], padding, className)}
	onclick={activate}
	{...rest}
>
	{#if icon || status === 'copied'}
		<Icon class={status === 'copied' ? 'text-green' : ''} src={status === 'copied' ? IconCheckFillSquare : icon!} />
	{/if}

	{#if children}
		{@render children()}
	{:else if label && copy}
		<span class="grid text-left">
			<span class="col-start-1 row-start-1">{said}</span>
			<span class="invisible col-start-1 row-start-1" aria-hidden="true">{widest}</span>
		</span>
	{:else if label}
		{label}
	{/if}

	{#if iconEnd}
		<Icon src={iconEnd} />
	{/if}
</svelte:element>

{#if copy}
	<span class="sr-only" aria-live="polite">{status === 'idle' ? '' : said}</span>
{/if}
