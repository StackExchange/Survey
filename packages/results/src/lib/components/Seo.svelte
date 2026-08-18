<script lang="ts">
	import { asset } from '$app/paths'
	import { page } from '$app/state'

	import { ogImage, siteDescription, siteName, siteUrl } from '$config'

	// Once per route: `<svelte:head>` does not de-duplicate, so a layout *and* a
	// page yields two of each tag. Site-wide tags live in app.html.
	interface Props {
		title?: string
		description?: string
		image?: string
		type?: 'website' | 'article'
		noindex?: boolean
		// Set false where a page has no .md twin, such as the error page.
		markdown?: boolean
		// The page's schema.org @graph, built in scripts/data.js and carried on the
		// payload. Absent on pages with no structured data, such as the error page.
		graph?: any[]
	}

	let { title, description = siteDescription, image = ogImage, type = 'website', noindex = false, markdown = true, graph }: Props = $props()

	const fullTitle = $derived(title ? `${title} | ${siteName}` : siteName)
	const canonical = $derived(`${siteUrl}${page.url.pathname}`)
	const imageUrl = $derived(`${siteUrl}${asset(image as `/${string}`)}`)

	// Absolute: the prerender crawler follows href on any tag, so a root-relative
	// one would be enqueued and validated as a page.
	const markdownUrl = $derived(`${siteUrl}${page.url.pathname === '/' ? '/index.md' : `${page.url.pathname}.md`}`)

	// A ld+json block is a data block, so the parser does not decode entities
	// inside it — an entity would land in the JSON as literal text. The tag is
	// assembled rather than written out: a literal closing tag would end this
	// block for both the Svelte compiler and eslint's parser.
	const jsonld = $derived(
		graph?.length
			? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</${'script'}>`
			: null
	)
</script>

<svelte:head>
	<title>{fullTitle}</title>

	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	{#if markdown}
		<link rel="alternate" type="text/markdown" href={markdownUrl} />
	{/if}

	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />

	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />

	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	{#if jsonld}
		{@html jsonld}
	{/if}
</svelte:head>
