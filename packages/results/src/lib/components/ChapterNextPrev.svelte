<script lang="ts">
	import { resolve } from '$app/paths'
	import { IconArrowDownLeft, IconArrowDownRight } from '@stackoverflow/stacks-icons/icons'

	import Icon from '$lib/components/Icon.svelte'
	import { chapterColour } from '$lib/constants'

	let { year, previous, next }: { year: string; previous?: any; next?: any } = $props()
</script>

{#snippet card(chapter: any, direction: 'previous' | 'next')}
	{@const back = direction === 'previous'}

	<li class="flex w-1/2 lg:w-1/3 items-end relative dark:text-black">
		<a
			class="group transition-transform hover:scale-110 p-6 w-full {back
				? 'bg-white dark:bg-black-200 origin-bottom-left'
				: `bg-${chapterColour(chapter.index).primary} origin-bottom-right`}"
			rel={back ? 'prev' : 'next'}
			href={resolve('/[year]/[chapter]/data', { year, chapter: chapter.id })}
		>
			<span class="{back ? 'text-black-400' : 'text-black'} flex items-center mb-2 text-sm">
				{back ? 'Previous' : 'Next'}:
			</span>

			<span class="font-headline block {back ? 'text-3xl mb-20' : 'text-5xl mb-40'}">
				{chapter.name}
			</span>
		</a>

		<Icon class="absolute bottom-4 {back ? 'left-4' : 'right-4'}" src={back ? IconArrowDownLeft : IconArrowDownRight} />
	</li>
{/snippet}

{#if previous || next}
	<section class="mt-24 bg-black-150 dark:bg-black-500" aria-labelledby="whats-next">
		<h2 id="whats-next" class="font-headline-notch text-4xl lg:text-6xl gutter">What’s next?</h2>

		<ul class="mt-6 flex justify-between gap-6">
			{#if previous}{@render card(previous, 'previous')}{/if}
			{#if next}{@render card(next, 'next')}{/if}
		</ul>
	</section>
{/if}
