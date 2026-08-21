<script lang="ts">
	import { IconArrowDownLeft, IconArrowDownRight } from '@stackoverflow/stacks-icons/icons'

	import { resolve } from '$app/paths'

	import { chapterColour } from '$config'

	import Icon from '$components/Icon.svelte'

	let { year, previous, next }: { year: string; previous?: any; next?: any } = $props()
</script>

{#snippet card(chapter: any, direction: 'previous' | 'next')}
	{@const back = direction === 'previous'}

	<li class="relative flex w-full lg:w-1/3 items-end dark:text-black">
		<a
			class="group w-full p-6 transition-transform hover:scale-110 {back
				? 'origin-bottom-left bg-white dark:bg-black-200 mr-12'
				: `${chapterColour(chapter.index).bg} origin-bottom-right ml-12`}"
			rel={back ? 'prev' : 'next'}
			href={resolve('/[year]/[chapter]/data', { year, chapter: chapter.id })}
		>
			<span class="{back ? 'text-black-400' : 'text-black'} mb-2 flex items-center text-sm">
				{back ? 'Previous' : 'Next'}:
			</span>

			<span class="block font-headline {back ? 'mb-20 text-3xl' : 'mb-40 text-5xl'}">
				{chapter.name}
			</span>
		</a>

		<Icon class="absolute bottom-4 {back ? 'left-4' : 'right-4'}" src={back ? IconArrowDownLeft : IconArrowDownRight} />
	</li>
{/snippet}

{#if previous || next}
	<section class="mt-5 bg-black-150 dark:bg-black-500" aria-labelledby="whats-next">
		<h2 id="whats-next" class="font-headline-notch gutter text-4xl lg:text-6xl">What’s next?</h2>

		<ul class="mt-6 flex flex-col lg:flex-row justify-between gap-6">
			{#if previous}{@render card(previous, 'previous')}{/if}
			{#if next}{@render card(next, 'next')}{/if}
		</ul>
	</section>
{/if}
