<script>
	import { IconArrowRight } from '@stackoverflow/stacks-icons/icons'

	import { resolve } from '$app/paths'

	import { count } from '$charts/utils/theme'
	import { chapterColour } from '$config'
	import { inversion } from '$lib/invert.svelte'

	import BrandHeader from '$components/BrandHeader.svelte'
	import ChapterHeader from '$components/ChapterHeader.svelte'
	import Icon from '$components/Icon.svelte'
	import Seo from '$components/Seo.svelte'

	import Hero from '$charts/Hero.svelte'
	import Quote from '$charts/text/Quote.svelte'

	let { data } = $props()

	const highlights = inversion()
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
		<img src="/img/home-categories.svg" class="h-auto w-full" width="611" height="485" alt="Categories" />
		<p class="max-w-2xl text-4xl">
			<span class="font-headline-notch block text-[260px] leading-60">
				{data.stats.questions}
			</span>
			questions asked across {data.stats.chapters} insightful categories
		</p>
	</section>

	<section class="spindle-scope relative overflow-hidden">
		<img src="/img/home-spindle.svg" alt="" class="spindle absolute top-0 left-0 z-0 ml-[-25%] w-full" />
		<div class="relative z-50 container my-60 flex items-end text-2xl leading-snug lg:w-50">
			<dl
				class="[&>dt]:font-headline-notch flex flex-col items-start *:bg-blue-extra-light *:px-5 *:dark:text-black [&>dd]:relative [&>dd]:z-30 [&>dd]:-mt-6 [&>dd]:-mb-3 [&>dd]:py-3 [&>dt]:text-[96px]"
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

	<section aria-label="Highlights" {@attach highlights.ground} class="bg-black-150 text-black dark:bg-black-600 dark:text-white">
		{#each data.chapters as chapter, chapterI (chapter.id)}
			<section {@attach highlights.trigger(chapterI % 2 === 1)} class="min-h-screen py-30">
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

	<nav aria-label="Table of contents" class="bg-black-150 py-30 text-center dark:bg-black-500">
		<div class="container">
			<h2 class="font-headline-notch mb-4 text-5xl lg:text-8xl">Jump in, learn more</h2>
			<p class="text-xl">Table of contents for the {data.settings.year} Stack Overflow Developer Survey</p>

			<ul class="mx-auto mt-15 grid gap-6 text-left font-headline text-2xl lg:max-w-[80%] lg:grid-cols-2">
				{#each data.chapters as chapter, i (chapter.id)}
					<li class="group min-h-80 bg-black dark:text-black">
						<a
							class="relative flex h-full flex-col items-start justify-between p-5 text-4xl transition-transform group-hover:-translate-2 bg-{chapterColour(
								chapter.index
							).primary}"
							href={resolve('/[year]/[chapter]', { year: data?.settings.year, chapter: chapter.id })}
						>
							<span class="text-2xl">{i + 1}.0</span>
							{chapter.name}
						</a>
					</li>
				{/each}
				<li class="group min-h-80 bg-black-500 text-white dark:bg-black-400">
					<a
						class="relative flex h-full flex-col bg-black p-4 transition-transform group-hover:-translate-2 dark:bg-black"
						href={resolve('/[year]/methodology', { year: data?.settings.year })}
					>
						<strong class="col-span-3 mt-auto text-4xl font-normal">Methodology</strong>
					</a>
				</li>
			</ul>
		</div>
	</nav>

	<nav aria-label="Previous surveys" class="bg-black bg-[url(/img/home-pryamid.svg)] bg-cover bg-center p-5 py-30">
		<div class="mx-auto max-w-2xl bg-white p-8 dark:bg-black">
			<h2 class="mb-8 text-center font-headline text-4xl">
				16 years of insights,<br />Powered by Developers.
			</h2>
			<p class="mb-2 text-base">Previous years:</p>
			<ul>
				{#each [2025, 2024, 2023, 2022, 2021] as year (`prev-${year}`)}
					<li>
						<a
							href="https://survey.stackoverflow.co/{year}"
							class="-mt-px flex justify-between border-b py-3 hover:-mx-4 hover:bg-black hover:px-4 hover:text-white dark:hover:bg-white dark:hover:text-black"
						>
							{year}
							<Icon src={IconArrowRight} />
						</a>
					</li>
				{/each}
			</ul>
			<a
				href="https://survey.stackoverflow.co/"
				class="mt-8 block w-full bg-black-200 px-5 py-2 text-center hover:bg-black-150 dark:text-black"
			>
				Go even more retro…
			</a>
		</div>
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
