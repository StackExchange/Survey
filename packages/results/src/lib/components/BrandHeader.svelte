<script>
	import { IconInfoFill, IconLogo } from '@stackoverflow/stacks-icons/icons'

	import { resolve } from '$app/paths'

	import Icon from '$components/Icon.svelte'

	let { label = null, children = null } = $props()
</script>

<header class="vt-chapter-header flex min-h-[70vh] flex-col bg-black-150 gutter dark:bg-black-500">
	<h1 class="chapter-title font-headline-notch my-auto flex flex-col items-start font-normal text-white">
		<a href={resolve('/')} class="bg-orange px-3 py-4 text-black"><Icon src={IconLogo} title="Stack Overflow" /></a>
		<span class="bg-black px-[0.3em] pt-[0.1em] pb-[0.2em] dark:bg-white dark:text-black">Developer</span>
		<span class="bg-black px-[0.3em] pb-[0.2em] dark:bg-white dark:text-black">Survey</span>
		{#if label}<span class="bg-white px-[0.3em] py-[0.15em] text-black dark:bg-black dark:text-white">{label}</span>{/if}
	</h1>

	{#if children}
		{@render children()}
	{:else}
		<p class="text-md relative mt-10 ml-auto max-w-2/3 bg-white px-6 py-4 text-black lg:max-w-1/2 lg:text-xl">
			<span class="absolute top-0 right-full bg-black p-1 text-white"><Icon src={IconInfoFill} /></span>
			The definitive report on the state of software development.
		</p>
	{/if}
</header>

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
