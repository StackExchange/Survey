<script lang="ts">
	import { formatOf, rowsOf, splitUnit } from '$charts/utils/expressive'
	import { shorten } from '$charts/utils/theme'

	let { figure }: { figure: any } = $props()

	const row = $derived(rowsOf(figure)[0])
	const short = $derived(shorten(figure))

	const { figures, unit } = $derived(splitUnit(row ? formatOf(figure)(row) : '—'))
</script>

<div class="flex aspect-square w-full flex-col bg-black-200 px-7 py-4">
	<p class="w-full font-headline text-[clamp(var(--text-6xl),14vw,14rem)] leading-none font-medium">
		{figures}{#if unit}<span class="text-[0.35em]">{unit}</span>{/if}
	</p>

	{#if row}
		<p class="mt-auto mb-3 text-lg text-black-400 dark:text-black-300">{short(row.response)}</p>
	{/if}
</div>
