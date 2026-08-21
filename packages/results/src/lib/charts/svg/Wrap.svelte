<script lang="ts">
	import type { Snippet } from 'svelte'

	import { captionOf, captionText } from '$charts/utils/caption'
	import { chromeReader, headerLayout, MASTHEAD, STATS } from '$charts/utils/chrome'
	import { figureTitle, PAD, px, theme } from '$charts/utils/theme'
	import { licence } from '$config'

	import Footer from './Footer.svelte'
	import Header from './Header.svelte'
	import Stats from './Stats.svelte'

	let {
		figure,
		width,
		height,
		reading,
		children,
	}: {
		figure: any
		width: number
		height: number
		reading?: string
		children?: Snippet
	} = $props()

	const label = $derived(figureTitle(figure))
	const uid = $props.id()

	const readChrome = chromeReader()
	const chrome = $derived(readChrome?.() ?? {})
	const brand = $derived(chrome.brand ?? false)
	// Set only by the export, so the preview stops at the caption.
	const footer = $derived(chrome.footer ?? false)
	const facts = $derived(captionOf(figure))
	const stats = $derived(Boolean(facts.n || facts.share || facts.subtext))
	const terms = $derived(brand ? `Data licensed under ${licence.database.full}` : undefined)
	const caption = $derived(stats || brand)
	const top = $derived(brand ? headerLayout(chrome, width, PAD).height : 0)
	// Where the masthead band starts: flush with the bottom edge, under everything.
	const foot = $derived(top + height + (caption ? STATS : 0) + PAD)
	const w = $derived(px(width))
	const h = $derived(px(foot + (footer ? MASTHEAD : 0)))

	const description = $derived(captionText(figure, reading))
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={w}
	height={h}
	viewBox="0 0 {w} {h}"
	preserveAspectRatio="xMidYMin meet"
	role="img"
	aria-label={label}
	aria-describedby={description ? `${uid}-desc` : undefined}
	font-family={theme.font}
>
	<title>{label}</title>
	{#if description}<desc id="{uid}-desc">{description}</desc>{/if}

	{#if brand}
		<rect x="0" y="0" width={w} height={h} fill={theme.background} />
	{/if}

	{#if brand}
		<Header {chrome} {width} margin={PAD} />

		<g transform="translate(0 {px(top)})">
			{@render children?.()}
		</g>
	{:else}
		{@render children?.()}
	{/if}

	{#if caption}
		<Stats {facts} {width} {terms} y={top + height} margin={brand ? PAD : undefined} />
	{/if}

	{#if footer}
		<g transform="translate(0 {px(foot)})">
			<Footer {chrome} {width} margin={PAD} />
		</g>
	{/if}
</svg>
