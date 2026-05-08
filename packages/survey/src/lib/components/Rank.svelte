<script lang="ts">
	import { answers, setAnswer } from '$lib/store/answers.svelte'
	import { normaliseOptions } from '$lib/data/options'
	import type { Question } from '$lib/types'
	import { DragDropProvider } from '@dnd-kit/svelte'
	import Markdown from './Markdown.svelte'
	import KeyBadge from './KeyBadge.svelte'
	import SortableItem from './SortableItem.svelte'

	let { question }: { question: Question } = $props()
	const opts = $derived(normaliseOptions(question.options))
	const optByKey = $derived(Object.fromEntries(opts.map((o) => [o.key, o])))

	const ordered = $derived.by(() => {
		const stored = answers[question.id] as string[] | undefined
		if (stored && stored.length === opts.length) return stored
		return opts.map((o) => o.key)
	})

	const labelByKey = $derived(Object.fromEntries(opts.map((o) => [o.key, o.label])))

	function move(arr: string[], from: number, to: number): string[] {
		if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr
		const next = [...arr]
		const [item] = next.splice(from, 1)
		next.splice(to, 0, item)
		return next
	}

	// dnd-kit fires onDragEnd with source/target sortables. Identify by id
	// (we use the option key) and reorder our array — internal indices are
	// driven by `index={i}` on each item.
	function onDragEnd(event: { canceled: boolean; operation: { source?: { id?: unknown } | null; target?: { id?: unknown } | null } }) {
		if (event.canceled) return
		const sourceId = event.operation.source?.id
		const targetId = event.operation.target?.id
		if (typeof sourceId !== 'string' || typeof targetId !== 'string') return
		if (sourceId === targetId) return
		const from = ordered.indexOf(sourceId)
		const to = ordered.indexOf(targetId)
		if (from < 0 || to < 0) return
		setAnswer(question.id, move(ordered, from, to))
	}
</script>

<DragDropProvider {onDragEnd}>
	<ol class="rank">
		{#each ordered as key, i (key)}
			<SortableItem id={key} index={i}>
				{#snippet children()}
					<div class="row">
						<span class="pos">{i + 1}</span>
						<span class="label">
							<Markdown inline content={labelByKey[key] ?? key} />
							{#if optByKey[key]?.explicitKey}<KeyBadge value={key} />{/if}
						</span>
						<span class="handle" aria-hidden="true">⋮⋮</span>
					</div>
				{/snippet}
			</SortableItem>
		{/each}
	</ol>
</DragDropProvider>

<style>
	.rank {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.row {
		display: grid;
		grid-template-columns: 2rem 1fr auto;
		align-items: center;
		gap: 0.6rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid rgba(127, 127, 127, 0.25);
		border-radius: 0.3rem;
		cursor: grab;
		user-select: none;
	}
	.row:active {
		cursor: grabbing;
	}
	.pos {
		font-variant-numeric: tabular-nums;
		opacity: 0.7;
	}
	.handle {
		opacity: 0.4;
		font-size: 1.2em;
		letter-spacing: -0.2em;
		padding-right: 0.4em;
	}
</style>
