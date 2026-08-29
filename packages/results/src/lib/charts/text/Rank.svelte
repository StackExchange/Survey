<script lang="ts">
	import type { OnHover } from '$charts/utils/theme'

	import { formatOf, rowsOf } from '$charts/utils/expressive'
	import { useHover } from '$charts/utils/hover.svelte'
	import { shorten, theme } from '$charts/utils/theme'

	let { figure, onhover }: { figure: any; onhover?: OnHover } = $props()

	const hover = useHover(() => onhover)

	const rows = $derived(rowsOf(figure))
	const short = $derived(shorten(figure))
	const format = $derived(formatOf(figure))

	const TABS = [theme.accent, theme.focus, theme.rest]
	const tabOf = (i: number, hovered: boolean) => (hovered ? theme.ink : (TABS[i] ?? theme.dim))

	const enter = (i: number, row: any, event: PointerEvent) =>
		hover.enter(
			i,
			{
				title: String(row.response ?? ''),
				rows: [{ value: format(row), label: `#${i + 1}`, color: theme.focus }],
			},
			event
		)
</script>

<div class="@container w-full">
	<ol class="flex flex-col gap-2 md:gap-3 font-headline leading-none text-xl md:text-2xl lg:text-3xl">
		{#each rows as row, i (row.response ?? i)}
			{@const hovered = hover.active === i}

			<li style="background: {hovered ? theme.rule : theme.ghost}">
				<div
					role="presentation"
					class="flex items-stretch"
					onpointermove={(event) => enter(i, row, event)}
					onpointerleave={hover.leave}
					onpointercancel={hover.leave}
				>
					<span aria-hidden="true" class="w-[5%] shrink-0" style="background: {tabOf(i, hovered)}"></span>

					<span class="min-w-0 flex-1 truncate py-[0.6em] pl-[0.8em]">{short(row.response)}</span>

					<span aria-hidden="true" class="shrink-0 py-[0.6em] pr-[0.667em] pl-[0.5em]">#{i + 1}</span>
				</div>
			</li>
		{/each}
	</ol>
</div>
