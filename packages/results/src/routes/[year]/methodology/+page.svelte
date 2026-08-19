<script lang="ts">
	import Seo from '$components/Seo.svelte'

	let { data } = $props()
</script>

<Seo title="Methodology {data.year}" description="How the survey was run and how the numbers were worked out." graph={data.jsonld} />

<main id="main" class="mx-auto max-w-3xl px-6 py-16" tabindex="-1">
	<h1 class="font-headline text-3xl font-bold">Methodology</h1>
	<p class="mt-3 text-lg">How the survey was run, who answered it, and how the numbers here were worked out.</p>
</main>
