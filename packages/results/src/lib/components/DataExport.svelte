<script lang="ts">
	import { IconArrowDownBox, IconClipboard } from '@stackoverflow/stacks-icons/icons'

	import { save } from '$charts/utils/export'
	import { licence, siteName } from '$lib/constants'
	import { toCsv, toMarkdown, toRows } from '$lib/table'
	import Button from './Button.svelte'

	// Built here rather than fetched from the .md twin, which only covers the
	// default respondent group. These follow the one on screen.
	let { figure, name, url, year }: { figure: any; name: string; url: string; year: string } = $props()

	const rows = $derived((figure.data ?? []).filter(Boolean))

	// Enough envelope to say which cut it is and its n.
	const json = $derived(
		JSON.stringify(
			{
				question: figure.name ?? figure.headline ?? figure.dataId,
				dataId: figure.dataId,
				demographic: figure.demographic,
				data: toRows(rows),
			},
			null,
			2
		)
	)

	const formats = $derived([
		{ id: 'json', label: 'JSON', text: json },
		{ id: 'markdown', label: 'Markdown', text: toMarkdown(rows) },
	])

	const csv = () => save(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }), `${name}.csv`)

	// ODbL asks for attribution. No accessed-date: the page is prerendered, so a
	// baked one would be the build's.
	const citation = $derived(
		`${licence.holder} (${year}). “${figure.name ?? figure.dataId}”. ${siteName} ${year}. Licensed under ${licence.database.name}. ${url}`
	)
</script>

<section class="mt-12" aria-labelledby="export">
	<h2 id="export" class="font-headline text-2xl font-semibold">Use this data</h2>
	<p class="mt-1 text-sm text-black-400 dark:text-black-300">
		{figure.demographic?.name}, as selected above. Numbers are raw in the CSV and JSON, formatted in the Markdown.
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
			<Button copy={citation} label="Copy citation" icon={IconClipboard} />
		</div>

		<textarea
			id="citation"
			class="h-20 w-full resize-y border-0 bg-black-150 p-3 font-mono text-xs"
			readonly
			spellcheck="false"
			value={citation}></textarea>

		<p class="mt-2 text-xs text-black-400 dark:text-black-300">
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the licence's own canonical URL -->
			Response data is released under the <a class="underline" href={licence.database.url}>{licence.database.name}</a>, which asks that you
			attribute it.
		</p>
	</div>
</section>
