<script lang="ts">
	import { snakeCase } from 'lodash-es'
	import { answers, setAnswer } from '$lib/store/answers.svelte'
	import { normaliseOptions } from '$lib/data/options'
	import type { Question } from '$lib/types'
	import Markdown from './Markdown.svelte'
	import KeyBadge from './KeyBadge.svelte'

	let { question }: { question: Question } = $props()
	const rows = $derived(normaliseOptions(question.options))
	const cols = $derived((question.scale?.columns ?? []).map((label) => ({ key: snakeCase(label), label })))
	const multiple = $derived(question.scale?.multiple ?? false)
	const value = $derived((answers[question.id] as Record<string, string | string[]> | undefined) ?? {})

	function single(rowKey: string, colKey: string) {
		setAnswer(question.id, { ...value, [rowKey]: colKey })
	}

	function multi(rowKey: string, colKey: string) {
		const current = (value[rowKey] as string[] | undefined) ?? []
		const set = new Set(current)
		if (set.has(colKey)) set.delete(colKey)
		else set.add(colKey)
		setAnswer(question.id, { ...value, [rowKey]: [...set] })
	}

	function isChecked(rowKey: string, colKey: string): boolean {
		const v = value[rowKey]
		if (Array.isArray(v)) return v.includes(colKey)
		return v === colKey
	}
</script>

<div class="scale-wrap">
	<table class="scale">
		<thead>
			<tr>
				<th></th>
				{#each cols as col (col.key)}
					<th><Markdown inline content={col.label} /></th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.key)}
				<tr>
					<th scope="row" class="row-label">
						<Markdown inline content={row.label} />
						{#if row.explicitKey}<KeyBadge value={row.key} />{/if}
					</th>
					{#each cols as col (col.key)}
						<td>
							{#if multiple}
								<input
									type="checkbox"
									name={`${question.id}__${row.key}`}
									checked={isChecked(row.key, col.key)}
									onchange={() => multi(row.key, col.key)}
								/>
							{:else}
								<input
									type="radio"
									name={`${question.id}__${row.key}`}
									checked={isChecked(row.key, col.key)}
									onchange={() => single(row.key, col.key)}
								/>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.scale-wrap {
		overflow-x: auto;
	}
	.scale {
		border-collapse: collapse;
		width: 100%;
	}
	.scale th,
	.scale td {
		padding: 0.4rem 0.6rem;
		text-align: center;
		border-bottom: 1px solid rgba(127, 127, 127, 0.2);
	}
	.scale tbody tr:hover {
		background: rgba(127, 127, 127, 0.06);
	}
	.row-label {
		text-align: left;
		font-weight: normal;
		min-width: 14rem;
	}
	.scale thead th {
		font-weight: 600;
		font-size: 0.9em;
		vertical-align: bottom;
	}
</style>
