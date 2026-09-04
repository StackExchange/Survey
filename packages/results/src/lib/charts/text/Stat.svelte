<script lang="ts">
	import { formatOf, rowsOf } from '$charts/utils/expressive'
	import { shorten } from '$charts/utils/theme'

	let { figure }: { figure: any } = $props()

	// Sized off the container, so the number fills the tile whatever its digits.
	const BUDGET = 160
	const CEILING = 60

	const row = $derived(rowsOf(figure)[0])
	const short = $derived(shorten(figure))

	// A trailing "%" is drawn smaller than its number, so it is split off.
	const splitUnit = (text: string) => (text.endsWith('%') ? { figures: text.slice(0, -1), unit: '%' } : { figures: text, unit: '' })

	const { figures, unit } = $derived(splitUnit(row ? formatOf(figure)(row) : '—'))
	const glyphs = $derived(Math.max(figures.length + (unit ? 0.4 : 0), 2))
	const size = $derived(Math.min(BUDGET / glyphs, CEILING))
</script>

<div
	class="@container flex aspect-square w-full flex-col px-7 py-4"
	style="background: var(--chapter-primary, var(--color-black-200)); color: var(--chapter-ink, inherit)"
>
	<p class="w-full font-headline leading-none font-medium" style="font-size: {size}cqw">
		{figures}{#if unit}<span class="text-[0.35em]">{unit}</span>{/if}
	</p>

	{#if row}
		<p class="mt-auto mb-3 text-2xl">{short(row.response)}</p>
	{/if}
</div>
