<script lang="ts">
	import { IconArrowDownBox, IconClipboard } from '@stackoverflow/stacks-icons/icons'
	import { SpotArticle, SpotCoding, SpotDataset, SpotDocument } from '@stackoverflow/stacks-icons/spots'

	import { save } from '$charts/utils/export'
	import { citation, licence } from '$config'
	import { toCsv, toJson, toMarkdown } from '$lib/table'

	import Button from './Button.svelte'
	import Icon from './Icon.svelte'

	let { figure, name, url, year }: { figure: any; name: string; url: string; year: string } = $props()

	// The BOM is for Excel char encoding
	const csv = () => save(new Blob(['﻿', toCsv(figure)], { type: 'text/csv;charset=utf-8' }), `${name}.csv`)

	const formats = $derived([
		{
			id: 'citation',
			label: 'Citation',
			spot: SpotArticle,
			text: citation(figure.name ?? figure.headline ?? figure.dataId, year, url),
			rows: 3,
		},
		{
			id: 'json',
			label: 'JSON',
			spot: SpotCoding,
			description: 'Structured for code, with the question, the year and the source url alongside the numbers.',
			text: JSON.stringify(toJson(figure, { year, url }), null, 2),
		},
		{
			id: 'markdown',
			label: 'Markdown',
			spot: SpotDocument,
			description: 'A formatted table, ready to paste into a document, an issue or a prompt.',
			text: toMarkdown(figure),
		},
		{
			id: 'csv',
			label: 'Spreadsheet',
			spot: SpotDataset,
			description: '.csv is a plain text format which most spreadsheet software can open.',
			download: csv,
		},
	])
</script>

<div class="flex flex-col gap-6">
	{#each formats as format (format.id)}
		<div class="flex flex-col gap-4 border-t border-black-200 pt-5 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
			<div class="lg:col-span-4">
				<h3 class="mb-2 font-headline text-2xl font-medium">
					{#if format.text}
						<label for="export-{format.id}">{format.label}</label>
					{:else}
						{format.label}
					{/if}
				</h3>

				<p class="max-w-100 text-black-400 dark:text-black-300">
					{#if format.id === 'citation'}
						Response data is released under the <a class="underline" href={licence.database.url}>{licence.database.name}</a>, which asks
						that you attribute it.
					{:else}
						{format.description}
					{/if}
				</p>
			</div>

			{#if format.text}
				<div class="lg:col-span-6">
					<textarea
						id="export-{format.id}"
						class="w-full resize-y border-0 bg-black-100 p-3 font-mono text-xs dark:bg-black"
						rows={format.rows ?? 14}
						readonly
						spellcheck="false"
						value={format.text}></textarea>
				</div>
			{/if}

			<div class="lg:col-span-2 lg:col-start-11">
				{#if format.download}
					<Button class="w-full truncate" label="Download CSV" icon={IconArrowDownBox} onclick={format.download} />
				{:else}
					<Button class="w-full truncate" copy={format.text} label="Copy {format.label}" icon={IconClipboard} />
				{/if}
			</div>
		</div>
	{/each}
</div>
