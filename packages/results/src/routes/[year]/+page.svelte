<script>
	import { IconArrowRight } from '@stackoverflow/stacks-icons/icons'

	import { resolve } from '$app/paths'

	import { count } from '$charts/utils/theme'
	import { chapterChartVars, chapterColour } from '$config'
	import { tinting } from '$lib/home-section-tint.svelte'

	import BrandHeader from '$components/BrandHeader.svelte'
	import ChapterHeader from '$components/ChapterHeader.svelte'
	import Feature from '$components/Feature.svelte'
	import Icon from '$components/Icon.svelte'
	import Seo from '$components/Seo.svelte'

	import Prose from '$charts/text/Prose.svelte'
	import Quote from '$charts/text/Quote.svelte'

	let { data } = $props()

	const highlights = tinting()
</script>

<Seo {...data.seo} graph={data.jsonld} />

<BrandHeader label={data.year} />

<main id="main" class="min-h-screen" tabindex="-1">
	<section class="container my-10 lg:my-30">
		<p class="mb-6 text-lg leading-snug">
			<span aria-hidden="true" class="mr-2 inline-block h-3 w-3 bg-orange"></span>
			{data.settings.description}
		</p>
		<p class="max-w-5xl text-3xl lg:text-4xl">
			{data.settings.descriptionLong}
		</p>
	</section>

	<section class="container my-30 grid gap-20 lg:my-60 lg:grid-cols-2">
		<img src="/img/home-categories.svg" class="h-auto w-full" width="611" height="485" alt="Categories" />
		<p class="max-w-2xl text-4xl">
			<span class="font-headline-notch block text-9xl lg:text-[260px] lg:leading-60">
				{data.settings.questionCount}
			</span>
			questions asked across {data.stats.chapters} insightful categories
		</p>
	</section>

	<section class="spindle-scope relative overflow-hidden border-b border-transparent dark:border-black-500">
		<img src="/img/home-spindle.svg" alt="" class="spindle absolute top-0 left-0 z-0 ml-[-25%] w-full" />
		<div class="relative z-10 container my-20 flex items-end text-2xl leading-snug lg:my-60 lg:w-50">
			<dl
				class="[&>dt]:font-headline-notch [&>dt]lg:text-[96px] flex flex-col items-start *:bg-blue-extra-light *:px-5 *:dark:text-black [&>dd]:relative [&>dd]:z-30 [&>dd]:-mt-6 [&>dd]:-mb-3 [&>dd]:py-3 [&>dt]:text-[75px]"
			>
				<dt>{data.stats.respondents}</dt>
				<dd>Responses</dd>
				<dt>{count(data.stats.countries)}</dt>
				<dd>Countries reached</dd>
				<dt>{data.stats.responseTime}</dt>
				<dd>Minutes to complete</dd>
			</dl>
		</div>
	</section>

	<section aria-label="Highlights" {@attach highlights.ground} class="theme-ground">
		{#each data.chapters as chapter, chapterI (chapter.id)}
			<section {@attach highlights.trigger(chapterI % 2 === 1)} class="min-h-screen py-8 lg:py-30" style={chapterChartVars(chapter.index)}>
				<ChapterHeader year={data.year} {chapter} variant="home" />

				{#each chapter.heroes as hero, i (`${chapter.id}-hero-${i}`)}
					<div class="container mx-auto py-10 lg:py-[7vh]">
						{#if hero.kind === 'text'}
							<Prose block={hero} />
						{:else if hero.kind === 'quote'}
							<Quote block={hero} />
						{:else}
							<Feature block={hero} tier="hero" year={data.year} {chapter} flip={i % 2 === 1} responsiveChart={false} />
						{/if}
					</div>
				{/each}
			</section>
		{/each}
	</section>

	<nav aria-label="Table of contents" class="bg-black-150 py-15 text-center lg:py-30 dark:bg-black-500">
		<div class="container">
			<h2 class="font-headline-notch mb-4 text-5xl lg:text-8xl">Jump in, learn more</h2>
			<p class="text-xl">Table of contents for the {data.settings.year} Stack Overflow Developer Survey</p>

			<ul class="mx-auto mt-15 grid gap-6 text-left font-headline text-2xl lg:max-w-[80%] lg:grid-cols-2">
				{#each data.chapters as chapter, i (chapter.id)}
					<li class="group bg-black lg:min-h-80 dark:text-black">
						<a
							class="relative flex h-full items-center justify-between p-5 text-3xl transition-transform group-hover:-translate-2 lg:flex-col lg:items-start lg:text-4xl {chapterColour(
								chapter.index
							).bg}"
							href={resolve('/[year]/[chapter]', { year: data?.settings.year, chapter: chapter.id })}
						>
							<span class="order-last lg:order-first lg:text-2xl">{i + 1}.0</span>
							{chapter.name}
						</a>
					</li>
				{/each}
				<li class="group bg-black-500 text-white lg:min-h-80 dark:bg-black-400">
					<a
						class="relative flex h-full flex-col bg-black p-4 transition-transform group-hover:-translate-2 dark:bg-black"
						href={resolve('/[year]/methodology', { year: data?.settings.year })}
					>
						<strong class="col-span-3 mt-auto text-3xl font-normal lg:text-4xl">Methodology</strong>
					</a>
				</li>
			</ul>
		</div>
	</nav>

	<nav aria-label="Previous surveys" class="bg-black bg-[url(/img/home-pryamid.svg)] bg-cover bg-center p-5 py-5 lg:py-30">
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
