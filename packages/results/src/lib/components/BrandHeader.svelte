<script>
	import { resolve } from '$app/paths'

	import { IconInfoFill, IconLogo } from '@stackoverflow/stacks-icons/icons'
	import Icon from '$lib/components/Icon.svelte'
	import PromoBanner from '$lib/components/PromoBanner.svelte'

	let { label = null, children = null } = $props()
</script>

<header class="vt-chapter-header gutter bg-black-150 dark:bg-black-500 min-h-[70vh] flex flex-col">
	<h1 class="chapter-title font-headline-notch font-normal text-white flex flex-col items-start my-auto">
		<a href={resolve('/')} class="bg-orange text-black py-4 px-3"><Icon src={IconLogo} title="Stack Overflow" /></a>
		<span class="bg-black dark:bg-white dark:text-black px-[0.3em] pt-[0.1em] pb-[0.2em]">Developer</span>
		<span class="bg-black dark:bg-white dark:text-black px-[0.3em] pb-[0.2em]">Survey</span>
		{#if label}<span class="bg-white text-black dark:bg-black dark:text-white px-[0.3em] py-[0.15em]">{label}</span>{/if}
	</h1>

	{#if children}
		{@render children()}
	{:else}
		<p class="ml-auto mt-10 text-md lg:text-xl bg-white text-black py-4 px-6 max-w-2/3 lg:max-w-1/2 relative">
			<span class="absolute top-0 right-full bg-black text-white p-1"><Icon src={IconInfoFill} /></span>
			The definitive report on the state of software development.
		</p>
	{/if}
</header>

<PromoBanner />

<style>
	.vt-chapter-header {
		padding-block: clamp(2.5rem, 8vw, 4rem) clamp(1.5rem, 6vw, 4.5rem);

		background-image: url(/bg-brand-hero.svg);
		background-position: 100% 100%;
		background-repeat: no-repeat;
		background-size: contain;
	}

	.chapter-title {
		font-size: clamp(var(--text-4xl), 5vw + 1rem, var(--text-9xl));
		line-height: 1;
	}
</style>
