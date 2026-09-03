<script lang="ts">
	import { IconArrowLeft, IconArrowRight, IconRefresh } from '@stackoverflow/stacks-icons/icons'

	import { rowsOf } from '$charts/utils/expressive'
	import { count } from '$charts/utils/theme'

	import Button from '$components/Button.svelte'

	let { figure }: { figure: any } = $props()

	const rows = $derived(rowsOf(figure).filter((row: any) => row.response))

	// Randomize on load
	let position = $state(0)

	$effect(() => {
		if (rows.length) position = Math.floor(Math.random() * rows.length)
	})

	const row = $derived(rows.length ? rows[position % rows.length] : null)
	const byline = $derived(row?.value ? String(row.value).split(', ').filter(Boolean) : [])
	const quote = $derived(row ? normalizeStackOverflow(row.response) : [])

	interface Segment {
		text: string
		highlight: boolean
	}

	// "SO", "Stack", "StackOverflow", "stack-overflow" to "Stack Overflow".
	function splitOn(text: string, pattern: RegExp): Segment[] {
		return text
			.split(pattern)
			.map((part, i) => (i % 2 ? { text: 'Stack Overflow', highlight: true } : { text: part, highlight: false }))
			.filter((segment) => segment.text !== '')
	}

	function normalizeStackOverflow(text: string): Segment[] {
		return splitOn(text, /(\bstack[\s-]*overflow\b)/gi).flatMap((segment) =>
			segment.highlight ? [segment] : splitOn(segment.text, /\b(SO)\b/g)
		)
	}

	const step = (delta: number) => {
		if (rows.length < 2) return
		position = (position + delta + rows.length) % rows.length
	}

	// A new random position, guaranteed to differ from the current one.
	function shuffle() {
		if (rows.length < 2) return
		let next = position % rows.length
		while (next === position % rows.length) next = Math.floor(Math.random() * rows.length)
		position = next
	}
</script>

<div class="h-full p-5">
	<div class="mb-6 flex flex-wrap items-center gap-1">
		<Button variant="invert" icon={IconRefresh} label="Shuffle" disabled={rows.length < 2} onclick={shuffle} />
		<Button
			variant="filled"
			size="icon"
			title="Previous comment"
			icon={IconArrowLeft}
			disabled={rows.length < 2}
			onclick={() => step(-1)}
		/>
		<Button
			variant="filled"
			size="icon"
			title="Next
			comment"
			icon={IconArrowRight}
			disabled={rows.length < 2}
			onclick={() => step(1)}
		/>
		<span class="text-md ml-auto pl-2 text-black-400 tabular-nums dark:text-black-300">
			{count(rows.length ? (position % rows.length) + 1 : 0)} of {count(rows.length)}
		</span>
	</div>

	{#if row}
		<blockquote class="flex aspect-square h-auto flex-col justify-between gap-8 overflow-y-auto lg:aspect-8/3">
			<p class="font-headline text-xl leading-snug text-balance md:text-2xl">
				“{#each quote as segment, i (i)}{#if segment.highlight}<span class="text-orange">{segment.text}</span
						>{:else}{segment.text}{/if}{/each}”
			</p>

			{#if byline.length}
				<cite class="mt-6 text-sm text-black-400 not-italic dark:text-black-300">
					{byline.join(' · ')}
				</cite>
			{/if}
		</blockquote>
	{/if}
</div>
