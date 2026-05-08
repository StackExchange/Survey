<script lang="ts">
	import { createSortable } from '@dnd-kit/svelte/sortable'
	import type { Snippet } from 'svelte'

	let {
		id,
		index,
		children,
	}: {
		id: string
		index: number
		children: Snippet<[{ isDragging: boolean }]>
	} = $props()

	const sortable = createSortable({
		get id() {
			return id
		},
		get index() {
			return index
		},
	})
</script>

<li {@attach sortable.attach} class="sortable-item" class:dragging={sortable.isDragging}>
	{@render children({ isDragging: sortable.isDragging })}
</li>

<style>
	.sortable-item {
		list-style: none;
		touch-action: none;
	}
	.dragging {
		opacity: 0.6;
	}
</style>
