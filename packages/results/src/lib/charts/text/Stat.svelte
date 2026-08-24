<script lang="ts">
	import { formatOf, rowsOf, splitUnit } from '$charts/utils/expressive'
	import { shorten } from '$charts/utils/theme'

	let { figure }: { figure: any } = $props()

	const row = $derived(rowsOf(figure)[0])
	const short = $derived(shorten(figure))

	const { figures, unit } = $derived(splitUnit(row ? formatOf(figure)(row) : '—'))
	const glyphs = $derived(Math.max(figures.length + (unit ? 0.4 : 0), 2))
	const size = $derived(Math.min(160 / glyphs, 60))
</script>

<div
	class="@container flex aspect-square w-full flex-col px-7 py-4"
	style="background: var(--chapter-primary, var(--color-black-200)); color: var(--chapter-ink, inherit)"
>
	<p class="w-full font-headline leading-none font-medium" style="font-size: {size}cqw">
		{figures}{#if unit}<span class="text-[0.35em]">{unit}</span>{/if}
	</p>

	{#if row}
		<p class="mt-auto mb-3 text-lg opacity-70">{short(row.response)}</p>
	{/if}
</div>
