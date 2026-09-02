<script lang="ts">
	import type { RowSelection } from '$charts/utils/rows.svelte'

	import { IconChevron16Down, IconChevron16Up, IconCross, IconEyeOff } from '@stackoverflow/stacks-icons/icons'

	import Button from '$components/Button.svelte'
	import Icon from '$components/Icon.svelte'

	// `normalise` belongs to the caller: the export reads it too.
	let {
		selection,
		scalable = false,
		focusable = false,
		normalise = $bindable(true),
	}: { selection: RowSelection; scalable?: boolean; focusable?: boolean; normalise?: boolean } = $props()

	const id = $props.id()

	let open = $state(false)
	let root = $state<HTMLElement | null>(null)
	let toggle = $state<HTMLElement | null>(null)

	const caret = $derived(open ? IconChevron16Up : IconChevron16Down)

	function close({ focusToggle = false } = {}) {
		open = false
		if (focusToggle) toggle?.focus()
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') close({ focusToggle: true })
	}

	function onWindowPointerdown(event: PointerEvent) {
		const target = event.target
		if (open && (!(target instanceof Node) || !root?.contains(target))) close()
	}

	// checked/indeterminate aren't attributes: the DOM only exposes them as properties.
	function indeterminate(node: HTMLInputElement, value: boolean) {
		node.indeterminate = value
		return { update: (value: boolean) => (node.indeterminate = value) }
	}
</script>

<svelte:window onkeydown={onWindowKeydown} onpointerdown={onWindowPointerdown} />

{#if selection.listable || scalable}
	<div class="flex flex-wrap items-center gap-2">
		<div bind:this={root} class="relative flex">

			{#if selection.touched}
				<Button variant="plain" iconEnd={IconCross} label="Reset" onclick={() => selection.reset()} />
			{/if}

			<button
				bind:this={toggle}
				type="button"
				class="flex text-sm cursor-pointer items-center gap-1.5 px-4 py-3 whitespace-nowrap {open
					? 'bg-black text-white dark:bg-black-500'
					: 'text-black hover:bg-black hover:text-white dark:text-black-300 lg:dark:bg-black-600'}"
				title={open ? 'Close chart options' : 'Chart options'}
				aria-expanded={open}
				aria-controls={id}
				onclick={() => (open = !open)}
			>
				Customize data
				<Icon src={caret} />
			</button>

			<div
				{id}
				class="absolute top-full right-0 z-30 -mt-px max-h-100 w-80 overflow-y-auto border bg-white p-4 dark:border-black-500 dark:bg-black {open
					? ''
					: 'hidden'}"
			>
				<fieldset>
					<legend class="font-semibold sr-only">Chart settings</legend>

					{#if scalable}
						<label class="mb-5 flex cursor-pointer items-start gap-2 text-sm leading-snug border-b border-black-200 pb-3">
							<input type="checkbox" class="mt-0.5 shrink-0" bind:checked={normalise} />
							<span class="select-none">
								Scale to the largest value
								<span class="block text-xs text-black-400 dark:text-black-300">Easier to read, no longer comparable with other charts.</span>
							</span>
						</label>
					{/if}

					<div class="flex items-start">
						{#if selection.listable}
							<label class="flex cursor-pointer items-start gap-2 text-sm leading-snug">
								<input
									type="checkbox"
									class="mt-0.5 shrink-0"
									checked={selection.hidden.length === 0}
									use:indeterminate={selection.hidden.length > 0 && selection.hidden.length < selection.rows.length}
									onchange={() => selection.toggleAll()}
								/>
								<span class="select-none">{selection.hidden.length === 0 ? 'Unselect all' : 'Select all'}</span>
							</label>
						{/if}
						<div class="mb-3 text-sm dark:border-black-500 ml-auto">
							{selection.kept.length} of {selection.rows.length} {#if selection.focus.length}/ {selection.focus.length} focused{/if}
						</div>
					</div>

					{#if selection.listable}
						<ul class="flex flex-col">
							{#each selection.rows as row (row.response)}
								{@const off = selection.hidden.includes(row.response)}
								{@const on = selection.focus.includes(row.response)}
								{@const last = !off && selection.kept.length === 1}

								<li class="-mx-4 flex items-start gap-2  odd:bg-black-100 dark:odd:bg-white/5">
									<label
										class="flex flex-1 items-start px-4 py-2 gap-2 text-sm leading-snug {off
											? 'text-black-400 dark:text-black-300'
											: ''} {last ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-black-225'}"
										title={last ? 'At least one row must stay visible' : undefined}
									>
										<input
											type="checkbox"
											class="mt-0.5 shrink-0"
											checked={!off}
											disabled={last}
											onchange={() => selection.toggle(row.response)}
										/>
										<span class="select-none">{row.response}</span>
									</label>

									{#if focusable}
										<button
											type="button"
											class="flex self-center mr-1 shrink-0 cursor-pointer items-center gap-1 px-2 py-0.5 text-xs {on
												? 'bg-black text-white dark:bg-white dark:text-black'
												: 'hover:bg-black-150 dark:hover:bg-black-500'}"
											aria-pressed={on}
											aria-label="Focus {row.response}"
											onclick={() => selection.highlight(row.response)}
										>
											{#if on}
												focused <Icon src={IconEyeOff} />
											{:else}
												focus <Icon src={IconEyeOff} />
											{/if}
										</button>
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
				</fieldset>
			</div>
		</div>
	</div>
{/if}
