<script lang="ts">
	import { IconArrowDownBox } from '@stackoverflow/stacks-icons/icons'

	import { charts } from '$charts'
	import { CHART_WIDTH } from '$charts/utils/chrome'
	import { save, toPng, toSvg } from '$charts/utils/export'
	import Icon from '$lib/components/Icon.svelte'

	import type { Chrome } from '$charts/utils/chrome'
	import type { RowSelection } from '$charts/utils/rows.svelte'
	import type { Snippet } from 'svelte'

	// Drawn here rather than at build time: that is what lets an export carry
	// options and follow the respondent group on screen.
	let {
		figure,
		name,
		year,
		url,
		chapter,
		chart,
		selection,
	}: {
		figure: any
		name: string
		year: string
		url: string
		chapter: any
		// The page's own figure, redrawn with whatever these controls are set to.
		chart: Snippet<[{ block: any; chrome: Chrome; width: number }]>
		/** Owned by the page and driven from the data table's leading columns. */
		selection: RowSelection
	} = $props()

	const Chart = $derived(charts[figure.chart as keyof typeof charts])

	let format = $state<'png' | 'svg'>('png')
	let normalise = $state(true)
	let status = $state<'idle' | 'working' | 'failed'>('idle')

	// One size: 2400px covers print and a retina screen.
	const SCALE = 3

	// Everything leaving the page carries attribution; on the page the figcaption
	// already says it.
	const chrome = $derived({
		brand: true,
		year,
		url,
		focus: selection.focus,
		normalise,
		chapter: chapter.name,
		section: figure.sectionName,
		headline: figure.headline ?? figure.name,
	})

	// The only charts that read `normalise`.
	const scalable = $derived(['bar', 'bar-clustered', 'dumbbell'].includes(figure.chart) && !figure.metadata?.label)

	async function png() {
		const blob = await toPng(Chart, { figure: selection.shown, width: CHART_WIDTH, scale: SCALE, chrome })
		if (!blob) return null
		return { blob, extension: 'png' }
	}

	async function svg() {
		const drawn = await toSvg(Chart, { figure: selection.shown, width: CHART_WIDTH, chrome })
		if (!drawn) return null
		// Optional, but it is what makes the file open as SVG rather than as text.
		const markup = `<?xml version="1.0" encoding="UTF-8"?>\n${drawn.markup}`
		return { blob: new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }), extension: 'svg' }
	}

	async function download() {
		status = 'working'
		try {
			const drawn = await (format === 'svg' ? svg() : png())
			if (!drawn) throw new Error('nothing rendered')
			save(drawn.blob, `${name}.${drawn.extension}`)
			status = 'idle'
		} catch (error) {
			console.error('chart export:', error)
			status = 'failed'
		}
	}

	const label = $derived({ idle: `Download ${format.toUpperCase()}`, working: 'Rendering…', failed: 'Could not render' }[status])
</script>

<div>
	<!-- One drawing, not a figure and a preview of it: the figure on the page *is*
	     the export, chrome and all, redrawn in place as the controls change. -->
	<div class="min-w-0 grow">{@render chart({ block: selection.shown, chrome, width: CHART_WIDTH })}</div>

	<fieldset class="flex gap-3 mt-4">
		<legend class="sr-only">Download this chart</legend>

		{#if scalable}
			<label class="flex items-start gap-2">
				<input type="checkbox" class="mt-1 shrink-0" bind:checked={normalise} />
				<span class="flex items-center gap-3">
				  Scale to the largest value
					<span class="text-black-400 dark:text-black-300 block text-xs">
						Easier to read, no longer comparable with other charts.
					</span>
				</span>
			</label>
		{/if}

		<label class="flex items-center gap-1 ml-auto">
			Format
			<select bind:value={format} class="dark:border-black-500 dark:bg-black border px-2 py-1 shrink-0 w-35">
				<option value="png">PNG</option>
				<option value="svg">SVG</option>
			</select>
		</label>

		<button
			type="button"
			class="hover:bg-white dark:hover:bg-black-600 flex cursor-pointer items-center justify-center gap-2 border px-3 py-2 disabled:cursor-wait"
			disabled={status === 'working' || !selection.kept.length}
			onclick={download}
		>
			<Icon src={IconArrowDownBox} />
			{label}
		</button>
	</fieldset>

	{#if selection.listable && selection.touched}
		<p class="dark:border-black-500 border-t pt-4">
			Drawing {selection.kept.length} of {selection.rows.length} rows{#if selection.focus.length}, {selection.focus.length} highlighted{/if}.
			<button type="button" class="cursor-pointer underline" onclick={() => selection.reset()}>Reset</button>
		</p>
	{/if}
</div>

<p class="sr-only" aria-live="polite">{status === 'idle' ? '' : label}</p>
