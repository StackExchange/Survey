<script lang="ts">
	import type { TooltipData } from '$charts/utils/tooltip'

	let { data, event }: { data: TooltipData | null; event?: PointerEvent } = $props()

	const OFFSET = 14

	let width = $state(0)
	let height = $state(0)
	let viewport = $state({ w: 0, h: 0 })

	const left = $derived(Math.max(8, Math.min((event?.clientX ?? 0) + OFFSET, viewport.w - width - 8)))
	const above = $derived((event?.clientY ?? 0) - height - OFFSET)
	const top = $derived(above < 8 ? (event?.clientY ?? 0) + OFFSET : above)
</script>

<svelte:window bind:innerWidth={viewport.w} bind:innerHeight={viewport.h} />

{#if data && event}
	<div
		aria-hidden="true"
		bind:clientWidth={width}
		bind:clientHeight={height}
		class="pointer-events-none fixed z-50 max-w-72 border-black-200 bg-white p-3 text-sm shadow-black-400 dark:border-black-500 dark:bg-black"
		style="left: {left}px; top: {top}px"
	>
		<p class="text-xs text-black-400 dark:text-black-300">{data.title}</p>

		<ul class="mt-1 space-y-0.5">
			{#each data.rows as row, i (i)}
				<li class="flex items-baseline gap-1">
					{#if row.color}
						<span class="mt-1.5 h-2 w-2 shrink-0" style="background: {row.color}"></span>
					{/if}
					<span class="font-semibold tabular-nums">{row.value}</span>
					{#if row.label}<span class="text-black-400 dark:text-black-300">{row.label}</span>{/if}
				</li>
			{/each}
		</ul>
	</div>
{/if}
