<script lang="ts">
	import { graph, JsonLd, Seo } from '$lib/seo'

	let { data } = $props()

	const path = $derived(`/${data.year}/methodology`)

	const nodes = $derived([
		graph.organization(),
		graph.website(),
		graph.webPage({
			path,
			title: `Methodology ${data.year}`,
			description: 'How the survey was run and how the numbers were worked out.',
			markdown: `${path}.md`,
		}),
		graph.breadcrumbs([
			{ name: 'Developer Survey', path: '/' },
			{ name: data.year, path: `/${data.year}` },
			{ name: 'Methodology', path },
		]),
	])
</script>

<Seo title="Methodology {data.year}" description="How the survey was run and how the numbers were worked out." />
<JsonLd graph={nodes} />

<main id="main" class="mx-auto max-w-3xl px-6 py-16" tabindex="-1">
	<h1 class="font-headline text-3xl font-bold">Methodology</h1>
	<p class="mt-3 text-lg">How the survey was run, who answered it, and how the numbers here were worked out.</p>
</main>
