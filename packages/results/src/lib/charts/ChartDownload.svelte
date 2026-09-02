<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'
	import type { Snippet } from 'svelte'

	import { IconArrowDownBox } from '@stackoverflow/stacks-icons/icons'
	import { SpotLoading } from '@stackoverflow/stacks-icons/spots'

	import { CHART_WIDTH } from '$charts/utils/chrome'
	import { save, toPng, toSvg } from '$charts/utils/export'
	import { rowSelection } from '$charts/utils/rows.svelte'

	import Button from '$components/Button.svelte'

	import { charts, FOCUSABLE, SCALABLE } from '$charts'

	import ChartOptions from './ChartOptions.svelte'

	let {
		figure,
		name,
		year,
		url,
		chart,
	}: {
		figure: any
		name: string
		year: string
		url: string
		chart: Snippet<[{ block: any; chrome: Chrome; width: number }]>
	} = $props()

	const Chart = $derived(charts[figure.chart as keyof typeof charts])

	const selection = rowSelection(() => figure)

	const id = $props.id()

	const formats = [
		{ value: 'png', label: 'Social', extension: '.png' },
		{ value: 'svg', label: 'Vector', extension: '.svg' },
	] as const

	let format = $state<'png' | 'svg'>('png')
	let normalise = $state(true)
	let status = $state<'idle' | 'working' | 'failed'>('idle')

	// One size: 2400px covers print and a retina screen.
	const SCALE = 3

	const chrome = $derived({
		brand: true,
		year,
		focus: selection.focus,
		normalise,
		url,
		// Not `figureTitle`: a masthead stays blank rather than falling back.
		headline: figure.headline || figure.name,
		demographic: figure.demographic?.name,
	})

	const scalable = $derived(SCALABLE.has(figure.chart) && !figure.value)
	const focusable = $derived(FOCUSABLE.has(figure.chart))

	// File only: on screen the page's own footer says the same.
	const exported = $derived({ ...chrome, footer: true })

	async function png() {
		const blob = await toPng(Chart, { figure: selection.shown, width: CHART_WIDTH, scale: SCALE, chrome: exported })
		if (!blob) return null
		return { blob, extension: 'png' }
	}

	async function svg() {
		const drawn = await toSvg(Chart, { figure: selection.shown, width: CHART_WIDTH, chrome: exported })
		if (!drawn) return null

		// What makes the file open as SVG rather than as text.
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
	<div class="overflow-x-auto">
		<div class="min-w-160">
			{@render chart({ block: selection.shown, chrome, width: CHART_WIDTH })}
		</div>
	</div>

	<fieldset class="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-3">
		<legend class="sr-only">Customise and download this chart</legend>

		<ChartOptions {selection} {scalable} {focusable} bind:normalise />

		<div class="flex flex-wrap items-center gap-3 lg:ml-auto lg:shrink-0">
			<span id="{id}-format" class="sr-only">Format</span>

			<div role="radiogroup" aria-labelledby="{id}-format" class="flex w-full bg-black-200 p-1 lg:w-auto dark:bg-black-500">
				{#each formats as option (option.value)}
					<label class="flex flex-1 cursor-pointer text-center text-nowrap">
						<input class="peer sr-only" type="radio" name="{id}-format" value={option.value} bind:group={format} />
						<span
							class="w-full px-4 py-1 select-none peer-checked:bg-white peer-checked:text-black peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-orange"
						>
							{option.label}
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
</div>

<p class="sr-only" aria-live="polite">{status === 'idle' ? '' : label}</p>
