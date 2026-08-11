<script lang="ts">
	import { cell, columns, ofSurvey } from '$lib/table'

	import type { RowSelection } from '$charts/utils/rows.svelte'

	// Same key-union helper as the markdown twins, so the two cannot disagree.
	//
	// `selection` puts the export's row controls in the leading columns. This table
	// already lists every response once with its numbers beside it, so a second
	// list of the same rows could only say less.
	let { figure, caption = true, selection }: { figure: any; caption?: boolean; selection?: RowSelection } = $props()

	const rows = $derived((figure.data ?? []).filter(Boolean))
	const keys = $derived(columns(rows))
	const labels = $derived(figure.metadata?.labels ?? null)

	const title = $derived(figure.headline ?? figure.name ?? figure.question ?? figure.dataId)
	const n = $derived(figure.demographic?.n?.toLocaleString('en-US') ?? 'unknown')
	const share = $derived(ofSurvey(figure.demographic?.share))

	// Sankey source/target are label indexes, so they read as text.
	const numeric = (key: string) =>
		!(labels && (key === 'source' || key === 'target')) && rows.some((row: any) => typeof row[key] === 'number')

	const controls = $derived(Boolean(selection?.listable))
</script>

{#if keys.length}
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			{#if caption}
				<caption class="text-black-400 dark:text-black-300 mb-2 text-left text-xs">
					{title} — {figure.demographic?.name}, n = {n}{#if share}
						({share}){/if}
				</caption>
			{/if}

			<thead>
				<tr class="border-black-150 dark:border-black-500 border-b">
					{#if controls}
						<th scope="col" class="py-1 pr-4 font-semibold">Show</th>
						<th scope="col" class="py-1 pr-4 font-semibold">Focus</th>
					{/if}

					{#each keys as key (key)}
						<th scope="col" class="py-1 pr-4 font-semibold {numeric(key) ? 'text-right' : ''}">
							{key.replace(/_/g, ' ')}
						</th>
					{/each}
				</tr>
			</thead>

			<tbody>
				{#each rows as row, i (i)}
					{@const off = controls && selection!.hidden.includes(row.response)}
					{@const on = controls && selection!.focus.includes(row.response)}

					<tr class="border-black-150 dark:border-black-500 border-b last:border-0 {off ? 'text-black-400 dark:text-black-300' : ''}">
						{#if controls}
							<td class="py-1 pr-4 align-top">
								<input type="checkbox" checked={!off} aria-label="Draw {row.response}" onchange={() => selection!.toggle(row.response)} />
							</td>

							<td class="py-1 pr-4 align-top">
								<button
									type="button"
									class="cursor-pointer border px-2 py-0.5 text-xs {on
										? 'bg-black text-white dark:bg-white dark:text-black'
										: 'hover:bg-black-150 dark:hover:bg-black-500'}"
									aria-pressed={on}
									aria-label="Highlight {row.response}"
									onclick={() => selection!.highlight(row.response)}
								>
									Focus
								</button>
							</td>
						{/if}

						{#each keys as key (key)}
							<td class="py-1 pr-4 align-top {numeric(key) ? 'text-right tabular-nums' : ''}">
								{cell(row[key], key, labels)}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
