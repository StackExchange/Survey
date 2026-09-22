<script lang="ts">
	import { tableOf } from '$lib/table'

	let { figure }: { figure: any } = $props()

	const table = $derived(tableOf(figure))
</script>

{#if table}
	<div class="overflow-auto">
		<table class="w-full text-left text-sm">
			<thead>
				<tr class="border-b border-black-150 dark:border-black-500">
					{#each table.headers as header, i (i)}
						<th scope="col" class="px-2 pb-2 font-semibold {table.numeric[i] ? 'text-right' : ''}">{i === 0 ? '' : header}</th>
					{/each}
				</tr>
			</thead>

			<tbody>
				{#each table.rows as row, i (i)}
					<tr class="border-b border-black-150 last:border-0 dark:border-black-500">
						{#each row.cells as value, c (c)}
							<td
								class="px-2 py-1.5 align-top {!(i % 2) ? 'bg-black-100 dark:bg-black-500' : undefined} {table.numeric[c]
									? 'text-right tabular-nums'
									: ''}">{value}</td
							>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
