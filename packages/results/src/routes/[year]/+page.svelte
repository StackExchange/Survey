<script>
	import { IconArrowRight } from '@stackoverflow/stacks-icons/icons'

	import { resolve } from '$app/paths'
	import Hero from '$charts/Hero.svelte'
	import Quote from '$charts/text/Quote.svelte'
	import { count } from '$charts/utils/theme'
	import { chapterColour } from '$config'
	import BrandHeader from '$lib/components/BrandHeader.svelte'
	import Button from '$lib/components/Button.svelte'
	import ChapterHeader from '$lib/components/ChapterHeader.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Seo from '$lib/components/Seo.svelte'

	let { data } = $props()
</script>

<Seo title="Results {data.year}" graph={data.jsonld} />

<BrandHeader label={data.year} />

<main id="main" class="min-h-screen" tabindex="-1">
	<section class="container my-30">
		<p class="mb-6 text-lg">
			<span aria-hidden="true" class="mr-2 inline-block h-3 w-3 bg-orange"></span>
			{data.settings.description}
		</p>
		<p class="max-w-5xl text-4xl">
			{data.settings.descriptionLong}
		</p>
	</section>

	<section class="container my-60 grid gap-20 lg:grid-cols-2">
		<img src="/home-categories.svg" class="h-auto w-full" width="611" height="485" alt="Categories" />
		<p class="max-w-2xl text-4xl">
			<span class="font-headline-notch block text-[260px] leading-60">
				{data.stats.questions}
			</span>
			questions asked across {data.stats.chapters} insightful categories
		</p>
	</section>

	<section class="spindle-scope relative overflow-hidden">
		<img src="/home-spindle.svg" alt="" class="spindle absolute top-0 left-0 z-0 ml-[-25%] w-full" />
		<div class="relative z-50 container my-60 flex items-end text-2xl leading-snug lg:w-50">
			<dl
				class="[&>dt]:font-headline-notch flex flex-col items-start *:bg-blue-extra-light *:px-5 [&>dd]:relative [&>dd]:z-30 [&>dd]:-mt-6 [&>dd]:-mb-3 [&>dd]:py-3 [&>dt]:text-[96px]"
			>
				<dt>{count(data.stats.respondents)}</dt>
				<dd>Responses</dd>
				<dt>{count(data.stats.countries)}</dt>
				<dd>Countries reached</dd>
				<dt>{count(data.stats.salaries)}</dt>
				<dd>Salaries shared</dd>
			</dl>
		</div>
	</section>

	<section aria-label="Highlights">
		{#each data.chapters as chapter (chapter.id)}
			<section class="min-h-screen bg-black-150 py-30 dark:bg-black-600">
				<ChapterHeader year={data.year} {chapter} variant="home" />

				{#each chapter.heroes as hero, i (`${chapter.id}-hero-${i}`)}
					{#if hero.kind === 'quote'}
						<article class="mx-auto max-w-2/3 py-40">
							<Quote block={hero} />
						</article>
					{:else}
						<article class="mx-auto max-w-2/3 py-40">
							<Hero block={hero} year={data.year} {chapter} flip={i % 2 === 1} />
						</article>
					{/if}
				{/each}
			</section>
		{/each}
	</section>

	<nav aria-label="Table of contents" class="px-5 py-30 text-center">
		<h2 class="font-headline-notch mb-3 text-8xl">Jump in, learn more</h2>
		<p class="text-xl">Table of contents for the {data.settings.year} Stack Overflow Developer Survey</p>

		<ul class="mx-auto mt-15 grid max-w-6xl gap-3 text-left text-2xl *:min-h-56 lg:grid-cols-2">
			{#each data.chapters as chapter, i (chapter.id)}
				<li class={`bg-${chapterColour(chapter.index).primary} p5 flex flex-col`}>
					<span class="font-headline">{i + 1}.0</span>
					<a class="flex items-center gap-2" href={resolve('/[year]/[chapter]', { year: data?.settings.year, chapter: chapter.id })}>
						{chapter.name}
						<Icon src={IconArrowRight} />
					</a>

					<ul class="mt-4 text-lg">
						{#each chapter.sections as section, secI (section.id)}
							<li>
								<a
									class="hover:underline"
									href="{resolve('/[year]/[chapter]/data', { year: data?.settings.year, chapter: chapter.id })}#{section.id}"
								>
									{i + 1}.{secI + 1}
									{section.name}
								</a>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
			<li class="bg-black text-white">
				<a class="d-block flex h-full items-end p-5" href={resolve('/[year]/methodology', { year: data?.settings.year })}> Methodology </a>
			</li>
		</ul>
	</nav>
</main>

<style>
	@keyframes spindle-turn {
		from {
			transform: rotate(-40deg);
		}
		to {
			transform: rotate(40deg);
		}
	}

	@supports (animation-timeline: view()) {
		@media (prefers-reduced-motion: no-preference) {
			.spindle-scope {
				view-timeline-name: --spindle;
			}

			.spindle {
				animation: spindle-turn auto linear both;
				animation-timeline: --spindle;
			}
		}
	}
</style>
