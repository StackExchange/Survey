<script lang="ts">
	import { px, theme } from '$charts/utils/theme'

	let {
		from,
		to,
		top,
		bottom,
		at,
		axis = 'x',
	}: { from: number; to: number; top: number; bottom: number; at?: number[]; axis?: 'x' | 'y' } = $props()

	const MARKS = [0, 0.25, 0.5, 0.75, 1] // percentages

	const along = $derived(axis === 'x' ? [from, to] : [top, bottom])
	const lines = $derived(at ?? MARKS.map((mark) => along[0] + (along[1] - along[0]) * mark))
</script>

{#each lines as line, i (i)}
	{@const pos = px(line)}

	<line
		x1={axis === 'x' ? pos : px(from)}
		x2={axis === 'x' ? pos : px(to)}
		y1={axis === 'x' ? px(top) : pos}
		y2={axis === 'x' ? px(bottom) : pos}
		stroke={theme.grid}
		stroke-width="1"
		stroke-linecap="round"
		stroke-dasharray="0.2 3"
		vector-effect="non-scaling-stroke"
	/>
{/each}
