<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'
	import type { Snippet } from 'svelte'

	import { IconArrowDownBox } from '@stackoverflow/stacks-icons/icons'
	import { SpotLoading } from '@stackoverflow/stacks-icons/spots'

	import { CHART_WIDTH } from '$charts/utils/chrome'
	import { save, toPng, toSvg } from '$charts/utils/export'
	import { rowSelection } from '$charts/utils/rows.svelte'

	import Button from '$components/Button.svelte'

	import { charts } from '$charts'

	import ChartOptions from './ChartOptions.svelte'

	// Drawn here rather than at build time: that is what lets an export carry
	// options and follow the respondent group on screen.
	let {
		figure,
		name,
		year,
		chapter,
		chart,
	}: {
		figure: any
		name: string
		year: string
		chapter: any
		// The page's own figure, redrawn with whatever these controls are set to.
		chart: Snippet<[{ block: any; chrome: Chrome; width: number }]>
	} = $props()

	const Chart = $derived(charts[figure.chart as keyof typeof charts])

	// Which rows the drawing carries. Owned here rather than by the page: the
	// controls over the chart and the file leaving it are the same decision.
	const selection = rowSelection(() => figure)

	// Radios need a group name of their own: a page can carry more than one of
	// these, and two groups sharing a name would fight over the checked option.
	const id = $props.id()

	// Named for what the file is for, not what it is: the extension is along for
	// the ride for anyone who does care which one they are picking.
	const formats = [
		{ value: 'png', label: 'Social', extension: '.png' },
		{ value: 'svg', label: 'Vector', extension: '.svg' },
	] as const

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
		focus: selection.focus,
		normalise,
		chapter: chapter.name,
		section: figure.sectionName,
		headline: figure.headline ?? figure.name,
	})

	// The only charts that read `normalise`.
	const scalable = $derived(['bar', 'bar-clustered', 'dumbbell'].includes(figure.chart) && !figure.value)

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

	const label = $derived({ idle: `Download`, working: 'Rendering…', failed: 'Could not render' }[status])
</script>

<div>
	<!-- One drawing, not a figure and a preview of it: the figure on the page *is*
	     the export, chrome and all, redrawn in place as the controls change. -->
	<div class="relative min-w-0 grow">
		<div class="absolute top-0 right-0 z-20">
			<ChartOptions {selection} />
		</div>

		<!-- Below its floor the drawing scrolls rather than re-laying out into unreadable labels. -->
		<div class="overflow-x-auto">
			<div class="min-w-160">
				{@render chart({ block: selection.shown, chrome, width: CHART_WIDTH })}
			</div>
		</div>
	</div>

	<fieldset class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">
		<legend class="sr-only">Download this chart</legend>

		{#if scalable}
			<label class="flex cursor-pointer items-start gap-2">
				<input type="checkbox" class="mt-1 shrink-0" bind:checked={normalise} />
				<span class="select-none">
					Scale to the largest value
					<span class="block text-xs text-black-400 dark:text-black-300"> Easier to read, no longer comparable with other charts. </span>
				</span>
			</label>
		{/if}

		<div class="flex flex-wrap items-center gap-3 lg:ml-auto lg:shrink-0">
			<span id="{id}-format">Format</span>

			<div role="radiogroup" aria-labelledby="{id}-format" class="flex bg-black-200 p-1 dark:bg-black-500">
				{#each formats as option (option.value)}
					<label class="flex cursor-pointer">
						<input class="peer sr-only" type="radio" name="{id}-format" value={option.value} bind:group={format} />
						<span
							class="px-4 py-1 select-none peer-checked:bg-white peer-checked:text-black peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-orange"
						>
							{option.label}
							<!-- Dimmed rather than coloured: this sits on the track when unpicked and
							     on the white pill when picked, and opacity reads on both. -->
							<span class="opacity-60">({option.extension})</span>
						</span>
					</label>
				{/each}
			</div>
		</div>

		<Button
			class="justify-center"
			onclick={download}
			disabled={status === 'working' || !selection.kept.length}
			iconEnd={status === 'working' ? SpotLoading : IconArrowDownBox}
		>
			{label}
		</Button>
	</fieldset>

	{#if selection.listable && selection.touched}
		<p class="border-t pt-4 dark:border-black-500">
			Drawing {selection.kept.length} of {selection.rows.length} rows{#if selection.focus.length}, {selection.focus.length} focused{/if}.
		</p>
	{/if}
</div>

<p class="sr-only" aria-live="polite">{status === 'idle' ? '' : label}</p>
