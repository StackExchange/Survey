<script lang="ts">
	import { page } from '$app/state'

	type Option = { href: string; label: string }

	let { options }: { options: [Option, Option] } = $props()

	const trim = (path: string) => path.replace(/\/+$/, '')

	// One link, not two: only the label you're not on is the destination.
	const at = $derived(
		Math.max(
			0,
			options.findIndex((option) => trim(option.href) === trim(page.url.pathname))
		)
	)
	const other = $derived(options[at === 0 ? 1 : 0])

	const here = 'bg-white text-black dark:bg-white'
	const there = 'group-hover:bg-black-150 dark:group-hover:bg-black-400'
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- the caller resolves both hrefs -->
<a
	href={other.href}
	aria-label="Switch to {other.label}"
	class="group flex w-fit bg-black-200 dark:bg-black-500 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
>
	{#each options as option, i (option.href)}
		<span class="px-5 py-1.5 {i === at ? here : there}">{option.label}</span>
	{/each}
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
