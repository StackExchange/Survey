<script lang="ts">
	import { IconArrowDownBox, IconClipboard } from '@stackoverflow/stacks-icons/icons'

	import { save } from '$charts/utils/export'
	import { citation, licence } from '$config'
	import { toCsv, toJson, toMarkdown } from '$lib/table'
	import Button from './Button.svelte'

	// Every format here is a rendering of the same `$lib/table` output as the data
	// table above and the page's markdown twin. Built in the browser rather than
	// fetched from the twin, which only covers the default respondent group —
	// these follow the one on screen.
	let { figure, name, url, year }: { figure: any; name: string; url: string; year: string } = $props()

	const formats = $derived([
		{ id: 'json', label: 'JSON', text: JSON.stringify(toJson(figure, { year, url }), null, 2) },
		{ id: 'markdown', label: 'Markdown', text: toMarkdown(figure) },
	])

	// The BOM is for Excel, not for CSV: without it Windows Excel reads the file as
	// the local codepage and "Côte d'Ivoire" arrives mangled. Added here rather than
	// in `toCsv` so the string stays clean CSV for the JSON and clipboard paths.
	const csv = () => save(new Blob(['\uFEFF', toCsv(figure)], { type: 'text/csv;charset=utf-8' }), `${name}.csv`)

	const cite = $derived(citation(figure.name ?? figure.headline ?? figure.dataId, year, url))

	// Said out loud only where it applies: a multi-series figure pivots in the
	// Markdown, so a cell holds one measure and the rest are in the CSV and JSON.
	const pivoted = $derived(Boolean(figure.series?.length))
</script>

<section class="mt-12" aria-labelledby="export">
	<h2 id="export" class="font-headline text-2xl font-semibold">Use this data</h2>
	<p class="mt-1 text-sm text-black-400 dark:text-black-300">
		{figure.demographic?.name}, as selected above. Numbers are raw in the CSV and JSON, formatted in the Markdown.
		{#if pivoted}
			The Markdown table shows one column per segment; the CSV and JSON carry every measure.
		{/if}
	</p>

	<Button class="mt-4" label="Download CSV" icon={IconArrowDownBox} onclick={csv} />

	<div class="mt-6 grid gap-x-6 gap-y-3 lg:grid-cols-2">
		{#each formats as format (format.id)}
			<div>
				<div class="flex justify-between">
					<label for="export-{format.id}" class="flex-1 border-t border-b border-l px-3 py-2 text-sm font-semibold">{format.label}</label>
					<Button copy={format.text} label="Copy {format.label}" icon={IconClipboard} />
				</div>

				<textarea
					id="export-{format.id}"
					class="h-64 w-full resize-y border-0 bg-black-150 p-3 font-mono text-xs"
					readonly
					spellcheck="false"
					value={format.text}></textarea>
			</div>
		{/each}
	</div>

	<div class="mt-3">
		<div class="flex justify-between">
			<label for="citation" class="flex-1 border-t border-b border-l px-3 py-2 text-sm font-semibold">Cite this</label>
			<Button copy={cite} label="Copy citation" icon={IconClipboard} />
		</div>

		<textarea
			id="citation"
			class="h-20 w-full resize-y border-0 bg-black-150 p-3 font-mono text-xs"
			readonly
			spellcheck="false"
			value={cite}></textarea>

		<p class="mt-2 text-xs text-black-400 dark:text-black-300">
			Response data is released under the <a class="underline" href={licence.database.url}>{licence.database.name}</a>, which asks that you
			attribute it.
		</p>
	</div>
</section>
