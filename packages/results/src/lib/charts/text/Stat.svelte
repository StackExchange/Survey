<script lang="ts">
	import { formatOf, rowsOf, splitUnit } from '$charts/utils/expressive'
	import { shorten } from '$charts/utils/theme'

	let { figure }: { figure: any } = $props()

	const row = $derived(rowsOf(figure)[0])
	const short = $derived(shorten(figure))

	const { figures, unit } = $derived(splitUnit(row ? formatOf(figure)(row) : '—'))
</script>

<p class="font-headline text-[clamp(var(--text-6xl),14vw,14rem)] leading-none font-medium">
	{figures}{#if unit}<span class="text-[0.35em]">{unit}</span>{/if}
</p>

{#if row}
	<p class="mt-6 text-lg text-black-400 dark:text-black-300">{short(row.response)}</p>
{/if}
