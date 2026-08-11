<script lang="ts">
	// Real text, not an `<svg>`: selectable, translatable, scales with the reader's
	// own font size, and liftable by an answer engine.
	import { formatOf, rowsOf } from '$charts/utils/expressive'
	import { shorten } from '$charts/utils/theme'

	let { figure }: { figure: any } = $props()

	const row = $derived(rowsOf(figure)[0])
	const short = $derived(shorten(figure))

	const text = $derived(row ? formatOf(figure)(row) : '—')

	// Only a trailing `%` splits off. A salary's `$` leads the number, and treating
	// that as the unit printed it twice.
	const unit = $derived(text.endsWith('%') ? '%' : '')
	const figures = $derived(unit ? text.slice(0, -unit.length) : text)
</script>

<p class="font-headline text-[clamp(var(--text-6xl),14vw,14rem)] leading-none font-medium">
	{figures}{#if unit}<span class="text-[0.35em]">{unit}</span>{/if}
</p>

{#if row}
	<p class="text-black-400 dark:text-black-300 mt-6 text-lg">{short(row.response)}</p>
{/if}
