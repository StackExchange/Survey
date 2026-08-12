<script lang="ts">
	import { asset } from '$app/paths'
	import { page } from '$app/state'

	import { ogImage, siteDescription, siteName, siteUrl } from '$lib/constants'
	import { markdownPath } from '$lib/markdown'

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
	}

	let { title, description = siteDescription, image = ogImage, type = 'website', noindex = false, markdown = true }: Props = $props()

	const fullTitle = $derived(title ? `${title} | ${siteName}` : siteName)
	const canonical = $derived(`${siteUrl}${page.url.pathname}`)
	const imageUrl = $derived(`${siteUrl}${asset(image as `/${string}`)}`)

	// Absolute: the prerender crawler follows href on any tag, so a root-relative
	// one would be enqueued and validated as a page.
	const markdownUrl = $derived(`${siteUrl}${markdownPath(page.url.pathname)}`)
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
</svelte:head>
