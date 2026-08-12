<script lang="ts">
	// Once per route, next to <Seo>: `<svelte:head>` does not de-duplicate.
	let { graph }: { graph: any[] } = $props()

	// A ld+json block is a data block, so the parser does not decode entities inside
	// it — an entity would land in the JSON as literal text.
	const json = $derived(JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c'))

	// Assembled, not written out: a literal closing tag would end this block for
	// both the Svelte compiler and eslint's parser.
	const tag = $derived(`<script type="application/ld+json">${json}</${'script'}>`)
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- serialised JSON-LD, escaped above -->
	{@html tag}
</svelte:head>
