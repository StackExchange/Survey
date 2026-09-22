<script lang="ts">
	import type { Snippet } from 'svelte'

	import { chromeReader, headerLayout, MASTHEAD, STATS } from '$charts/utils/chrome'
	import { captionOf, captionText } from '$charts/utils/expressive'
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
		note,
		children,
	}: {
		figure: any
		width: number
		height: number
		reading?: string
		/** An extra note appended to the subtext stat, e.g. a chart-level truncation notice. */
		note?: string
		children?: Snippet
	} = $props()

	const label = $derived(figureTitle(figure))
	const uid = $props.id()

	const readChrome = chromeReader()
	const chrome = $derived(readChrome?.() ?? {})
	const brand = $derived(chrome.brand ?? false)
	const footer = $derived(chrome.footer ?? false)
	const rawCaption = $derived(captionOf(figure))
	const facts = $derived({ ...rawCaption, subtext: [rawCaption.subtext, note].filter(Boolean).join(' · ') })
	const editorial = $derived(Boolean(figure?.tier))
	const stats = $derived(Boolean(facts.n || facts.share || facts.subtext) && (brand || !editorial))
	const terms = $derived(brand ? `Data licensed under ${licence.database.full}` : undefined)
	const caption = $derived(stats || brand)
	const top = $derived(brand ? headerLayout(chrome, width, PAD).height : 0)
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
	{#if brand}<title>{label}</title>{/if}
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
