<script lang="ts">
	import type { RowSelection } from '$charts/utils/rows.svelte'

	import { ofSurvey, tableOf } from '$lib/table'

	// The table itself comes from `$lib/table`, the same builder behind the
	// markdown twins and the exports — so a heading, a rounding or a series pivot
	// cannot differ between the page and the file you download from it.
	//
	// `selection` puts the export's row controls in the leading columns. This table
	// already lists every response once with its numbers beside it, so a second
	// list of the same rows could only say less.
	let { figure, caption = true, selection }: { figure: any; caption?: boolean; selection?: RowSelection } = $props()

	const table = $derived(tableOf(figure))

	const title = $derived(figure.headline ?? figure.name ?? figure.question ?? figure.dataId)
	const n = $derived(figure.demographic?.n?.toLocaleString('en-US') ?? 'unknown')
	const share = $derived(ofSurvey(figure.demographic?.share))

	// Only offered where a response identifies one row, which a pivoted table also
	// satisfies — but the selection reads the flat rows, so it decides.
	const controls = $derived(Boolean(selection?.listable))
</script>

{#if table}
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm">
			{#if caption}
				<caption class="mb-2 text-left text-xs text-black-400 dark:text-black-300">
					{title} — {figure.demographic?.name}, n = {n}{#if share}
						({share}){/if}
				</caption>
			{/if}

			<thead>
				<tr class="border-b border-black-150 dark:border-black-500">
					{#if controls}
						<th scope="col" class="py-1 pr-4 font-semibold">Show</th>
						<th scope="col" class="py-1 pr-4 font-semibold">Focus</th>
					{/if}

					{#each table.headers as header, i (i)}
						<th scope="col" class="py-1 pr-4 font-semibold {table.numeric[i] ? 'text-right' : ''}">{header}</th>
					{/each}
				</tr>
			</thead>

			<tbody>
				{#each table.rows as row, i (i)}
					{@const off = controls && selection!.hidden.includes(row.response!)}
					{@const on = controls && selection!.focus.includes(row.response!)}

					<tr class="border-b border-black-150 last:border-0 dark:border-black-500 {off ? 'text-black-400 dark:text-black-300' : ''}">
						{#if controls}
							<td class="py-1 pr-4 align-top">
								<input type="checkbox" checked={!off} aria-label="Draw {row.response}" onchange={() => selection!.toggle(row.response!)} />
							</td>

							<td class="py-1 pr-4 align-top">
								<button
									type="button"
									class="cursor-pointer border px-2 py-0.5 text-xs {on
										? 'bg-black text-white dark:bg-white dark:text-black'
										: 'hover:bg-black-150 dark:hover:bg-black-500'}"
									aria-pressed={on}
									aria-label="Highlight {row.response}"
									onclick={() => selection!.highlight(row.response!)}
								>
									Focus
								</button>
							</td>
						{/if}

						{#each row.cells as value, c (c)}
							<td class="py-1 pr-4 align-top {table.numeric[c] ? 'text-right tabular-nums' : ''}">{value}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
