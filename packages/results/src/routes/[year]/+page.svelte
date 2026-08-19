<script>
  import { resolve } from '$app/paths'
  import { chapterColour } from '$config'

	import BrandHeader from '$lib/components/BrandHeader.svelte'
	import ChapterHeader from '$lib/components/ChapterHeader.svelte'
	import Hero from '$charts/Hero.svelte'
	import Quote from '$charts/text/Quote.svelte'
	import Seo from '$lib/components/Seo.svelte'
	import Button from '$lib/components/Button.svelte'

	import { count } from '$charts/utils/theme'
	import Icon from '$lib/components/Icon.svelte'
	import { IconArrowRight } from '@stackoverflow/stacks-icons/icons'

	let { data } = $props()
</script>

<Seo title="Results {data.year}" graph={data.jsonld} />

<BrandHeader label={data.year} />

<main id="main" class="min-h-screen" tabindex="-1">
	<section class="container my-30">
		<p class="mb-6 text-lg">
		  <span aria-hidden="true" class="w-3 h-3 bg-orange inline-block mr-2"></span>
		  {data.settings.description}
		</p>
		<p class="text-4xl max-w-5xl">
		  {data.settings.descriptionLong }
		</p>
	</section>

	<section class="container my-60 grid lg:grid-cols-2 gap-20">
	  <img src="/home-categories.svg" class="w-full h-auto" width="611" height="485" alt="Categories" />
		<p class="text-4xl max-w-2xl">
  		<span class="font-headline-notch text-[260px] leading-60 block">
        {data.stats.questions}
  		</span>
      questions asked across {data.stats.chapters} insightful categories
		</p>
	</section>

	<section class="spindle-scope relative overflow-hidden">
	  <img src="/home-spindle.svg" alt="" class="spindle absolute z-0 top-0 left-0 w-full ml-[-25%]" />
	  <div class="container my-60 leading-snug text-2xl flex items-end lg:w-50 relative z-50">
  		<dl class="flex flex-col items-start *:px-5 *:bg-blue-extra-light [&>dd]:py-3 [&>dd]:-mt-6 [&>dd]:-mb-3 [&>dd]:relative [&>dd]:z-30 [&>dt]:font-headline-notch [&>dt]:text-[96px]">
        <dt>{count(data.stats.respondents)}</dt>
        <dd>Responses</dd>
        <dt>{count(data.stats.countries)}</dt>
        <dd>Countries reached</dd>
        <dt>{count(data.stats.technologies)}</dt>
        <dd>Technologies covered</dd>
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

	<nav aria-label="Table of contents" class="py-30 px-5 text-center">
	  <h2 class="font-headline-notch text-8xl mb-3">Jump in, learn more</h2>
		<p class="text-xl">Table of contents for the {data.settings.year} Stack Overflow Developer Survey</p>

		<ul class="max-w-6xl mt-15 mx-auto grid lg:grid-cols-2 gap-3 *:min-h-56">
      {#each data.chapters as chapter, i (chapter.id)}
        <li class={`bg-${chapterColour(chapter.index).primary} flex flex-col`}>
          <span class="font-headline">{i + 1}.0</span>
          <strong></strong>
          <Button iconEnd={IconArrowRight} href={resolve('/[year]/[chapter]', { year: data?.settings.year, chapter: chapter.id })}>
            {chapter.name}
          </Button>
        </li>
			{/each}
      <li class="bg-black text-white">
        <a class="d-block" href={resolve('/[year]/methodology', { year: data?.settings.year })}>
          Methodology
        </a>
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
