<script lang="ts">
	// The `<svg>` root every chart shares, sized for a standalone file. No drawn
	// heading — the page supplies that around the figure.
	import { ofSurvey } from '$lib/table'
	import Attribution from './Attribution.svelte'
	import Header from './Header.svelte'
	import Stats from './Stats.svelte'
	import { chromeReader, FOOTER, headerLayout, STATS } from '$charts/utils/chrome'
	import { PAD, px, theme } from '$charts/utils/theme'

	import type { Snippet } from 'svelte'

	// `reading` is the chart's own account of its numbers, for the expressive forms
	// that draw few or no value labels. Leads the description.
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

	const label = $derived(figure.headline ?? figure.name ?? figure.question ?? figure.chart)
	const uid = $props.id()

	// Only an export sets this. On the page it is undefined and nothing below runs.
	const readChrome = chromeReader()
	const chrome = $derived(readChrome?.() ?? {})

	// A card lays the chart out itself, so this nests and leaves the ground and the
	// band to the card.
	const brand = $derived(chrome.brand ?? false)

	const n = $derived(figure.demographic?.n?.toLocaleString('en-US') ?? '')
	const share = $derived(ofSurvey(figure.demographic?.share))

	// In the drawing rather than beside it, so it travels with it.
	const stats = $derived(Boolean(n || share || figure.subtext))

	// A chart draws from its own origin, so the header is made room for by moving
	// the whole drawing down rather than by the chart knowing about it.
	const top = $derived(brand ? headerLayout(chrome, width, PAD).height : 0)

	// Charts compose their height from font sizes and ratios, so it arrives long.
	const w = $derived(px(width))
	const h = $derived(px(top + height + (stats ? STATS : 0) + (brand ? FOOTER : 0)))

	// The marks are role="presentation", so this is all a screen reader gets from
	// the drawing itself — the numbers live in the table beside it.
	const description = $derived(
		[reading, figure.demographic?.name, n && `n = ${n}`, share && `${share} of respondents`, figure.subtext].filter(Boolean).join(' · ')
	)
</script>

<!-- font-family on the root so every mark inherits it. `preserveAspectRatio` is
     what fits the chart into a card's content box: an inner <svg> scales its own
     viewBox, so nothing has to measure the drawing first. -->
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
		<!-- Opaque, and behind the marks. A chart on the page inherits the page's
		     ground; a file does not, and transparent ink on someone else's dark
		     background is unreadable. -->
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

	{#if stats}
		<Stats {figure} {width} {n} {share} y={top + height} margin={brand ? PAD : undefined} />
	{/if}

	{#if brand}
		<Attribution {chrome} y={top + height + (stats ? STATS : 0)} {width} margin={PAD} />
	{/if}
</svg>
