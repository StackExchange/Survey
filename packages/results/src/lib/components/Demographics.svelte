<script module lang="ts">
	// Shared with the page, which needs it for the panel's `aria-labelledby`.
	export const tabId = (panelId: string, id: string) => `tab-${panelId}-${id}`
</script>

<script lang="ts">
	import { respondents } from '$lib/table'

	// Demographic tabs. Presentational — the page owns the selection. One shared
	// panel, so every tab points at the same `aria-controls`.
	let {
		demographics,
		selected,
		panelId,
		label = 'Respondent group',
		onselect,
	}: {
		demographics: any[]
		selected: string
		panelId: string
		label?: string
		// eslint-disable-next-line no-unused-vars -- a parameter name in a type, which the base JS rule misreads
		onselect: (id: string) => void
	} = $props()

	let tablist = $state<HTMLDivElement | null>(null)

	// Automatic activation, per the WAI-ARIA tabs pattern: the data is already here.
	function onKeydown(event: KeyboardEvent) {
		const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
		const at = demographics.findIndex((d) => d.demographic.id === selected)

		let next: number
		if (step !== undefined) next = (at + step + demographics.length) % demographics.length
		else if (event.key === 'Home') next = 0
		else if (event.key === 'End') next = demographics.length - 1
		else return

		event.preventDefault()
		const id = demographics[next].demographic.id
		onselect(id)
		tablist?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(panelId, id))}`)?.focus()
	}
</script>

<div
	bind:this={tablist}
	role="tablist"
	aria-label={label}
	class="mb-2 flex flex-nowrap gap-2 overflow-x-auto bg-white lg:mb-0 dark:bg-black"
>
	{#each demographics as entry (entry.demographic.id)}
		{@const id = entry.demographic.id}
		{@const active = id === selected}

		<button
			type="button"
			role="tab"
			id={tabId(panelId, id)}
			aria-selected={active}
			aria-controls={panelId}
			tabindex={active ? 0 : -1}
			class="relative cursor-pointer px-5 py-3 whitespace-nowrap {active
				? 'bg-black-150 font-semibold dark:bg-black-500'
				: 'border-transparent text-black-400 hover:text-black lg:bg-black-100 dark:text-black-300 dark:hover:border-black-500 dark:hover:text-white lg:dark:bg-black-600'}"
			onclick={() => onselect(id)}
			onkeydown={onKeydown}
		>
			{entry.demographic.name}
			<!-- `relative` on the button is load-bearing: sr-only is position:absolute,
			     and without a positioned ancestor these resolve against the initial
			     containing block, escaping the tablist's overflow and widening the
			     document by however far the last tab sits off-screen. -->
			<span class="sr-only">, n = {respondents(entry.demographic.n)}</span>
		</button>
	{/each}
</div>
