<script lang="ts">
	import { resolve } from '$app/paths'
	import type { Snippet } from 'svelte'

	import PromoBanner from '$lib/components/PromoBanner.svelte'
	import Markdown from '$lib/components/Markdown.svelte'
	import { chapterColour } from '$lib/constants'

	type Variant = 'overview' | 'chapter' | 'data' | 'panel' | 'question'

	let {
		year,
		chapter,
		section,
		variant = 'chapter',
		children,
	}: {
		year: string
		chapter: any
		section?: string
		variant?: Variant
		children?: Snippet
	} = $props()

	// Presentation, so derived here rather than shipped from the server.
	const colours = $derived(chapterColour(chapter.index))
	const bg = $derived(`bg-${colours.primary}`)

	const variants = $derived({
		overview: {
			innerClass: 'container mx-auto',
			nameEl: 'h2',
			wrapClass: null,
			nameClass: 'font-headline-notch text-7xl text-[clamp(var(--text-4xl),5vw+1rem,var(--text-7xl))] font-semibold',
			blockClass: 'px-3 py-2',
			sectionClass: 'bg-black text-white dark:bg-white dark:text-black',
			descriptionClass: 'mt-5',
			vt: false,
			mark: false,
		},
		chapter: {
			innerClass: 'container mx-auto',
			nameEl: 'h1',
			wrapClass: `flex flex-col items-stretch pt-25 pb-7 min-h-[50vh] ${bg} bg-[url(/bg-chapter-hero.svg)] bg-no-repeat bg-cover bg-bottom-right`,
			nameClass: 'font-headline-notch mt-auto text-8xl text-[clamp(var(--text-5xl),5vw+1rem,var(--text-8xl))] font-normal',
			blockClass: '',
			sectionClass: 'bg-black text-white dark:bg-white dark:text-black',
			descriptionClass: null,
			vt: true,
			mark: false,
		},
		data: {
			innerClass: 'container mx-auto',
			nameEl: 'h1',
			wrapClass: 'bg-black-150 relative overflow-hidden flex flex-col items-stretch pt-25 pb-7 dark:bg-black-500 min-h-[40vh]',
			nameClass: 'font-headline text-4xl font-normal',
			blockClass: 'px-2 py-1',
			sectionClass: 'bg-black text-white dark:bg-white dark:text-black',
			descriptionClass: 'text-xl bg-white dark:bg-black p-4',
			vt: true,
			mark: true,
		},
		panel: {
			innerClass: '',
			// Sits inside a chapter's `overview` h2 on the year page, so it nests as h3.
			nameEl: 'h3',
			wrapClass: '',
			nameClass: 'font-headline flex-wrap text-3xl font-normal',
			blockClass: 'px-2 py-1',
			sectionClass: 'bg-black text-white dark:bg-white dark:text-black',
			// The chapter description already leads the section; the panel carries the
			// block's own headline and description through `children` instead.
			descriptionClass: null,
			vt: false,
			mark: true,
		},
		question: {
			innerClass: 'container mx-auto',
			nameEl: 'h1',
			wrapClass: 'bg-black-100 relative overflow-hidden flex flex-col items-stretch px-6 pt-30 pb-8',
			nameClass: 'sr-only font-headline flex-wrap text-3xl font-normal',
			blockClass: 'px-2 py-1',
			sectionClass: 'sr-only',
			descriptionClass: 'text-xl mt-5 w-1/2',
			vt: false,
			mark: true,
		},
	} satisfies Record<Variant, unknown>)

	const options = $derived(variants[variant])

	// A null `descriptionClass` is how a variant opts out of the chapter description.
	const description = $derived(options.descriptionClass ? chapter.description : '')
</script>

<header class="{options.vt ? 'vt-chapter-header' : ''} {options.wrapClass}">
	{#if options.mark}
		<svg
			class="pointer-events-none absolute right-0 bottom-0 h-full w-1/2 max-w-220"
			style="--mark-primary: var(--color-{colours.primary}, #201c1d); --mark-secondary: var(--color-{colours.secondary}, #998b7a)"
			viewBox="0 0 680 435"
			fill="none"
			preserveAspectRatio="xMaxYMax meet"
			aria-hidden="true"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g fill="var(--mark-primary)">
				<path d="m264.001 47.999h112v54h-112z" />
				<path d="m227.001 118.999h185v54h-185z" />
				<path d="m170.001 190.999h278v54h-278z" />
				<path d="m114.001 262.999h371v54h-371z" />
				<path d="m57.0009 334.999h464v54h-464z" />
				<path d="m1.00092 405.999h556v29h-556z" />
			</g>
			<g fill="var(--mark-secondary)">
				<path d="m376.001 47.999h38v54h-38z" />
				<path d="m412.001 118.999h41v54h-41z" />
				<path d="m448.001 190.999h61v54h-61z" />
				<path d="m485.001 262.999h81v54h-81z" />
				<path d="m521.001 334.999h101v54h-101z" />
				<path d="m557 406h123v29h-123z" />
			</g>
		</svg>
	{/if}

	<div class="{options.innerClass} relative z-40 flex flex-col flex-1">
		<svelte:element this={options.nameEl} class="flex {options.nameClass}">
			<a class="inline-block {bg} text-black {options.blockClass}" href={resolve('/[year]/[chapter]', { year, chapter: chapter.id })}>
				{chapter.name}
			</a>
			{#if section}
				<span class="{options.sectionClass} {options.blockClass}">{section}</span>
			{/if}
		</svelte:element>

		{#if description}
			<Markdown content={description} class="{options.descriptionClass} mb-auto max-w-2xl" />
		{/if}

		{#if children}
			{@render children()}
		{/if}
	</div>
</header>

{#if !['overview', 'panel'].includes(variant)}
	<PromoBanner />
{/if}
