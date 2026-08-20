<script lang="ts">
	import type { RowSelection } from '$charts/utils/rows.svelte'

	import {
		IconEye,
		IconEyeOff,
		IconWindowFillSideArrowRight,
		IconWindowFillSideRight,
		IconWindowSideArrowLeft,
	} from '@stackoverflow/stacks-icons/icons'

	import Button from '$components/Button.svelte'
	import Icon from '$components/Icon.svelte'

	// Which responses the export draws, and which it brings forward. Placed by the
	// caller — only the panel is positioned here, against the toggle it hangs from.
	// Over the chart rather than beside the numbers: these controls change the
	// drawing, and the data table below says what the figure holds regardless.
	let { selection }: { selection: RowSelection } = $props()

	const id = $props.id()

	let open = $state(false)
	let hovered = $state(false)
	let root = $state<HTMLElement | null>(null)
	let toggle = $state<HTMLElement | null>(null)

	// Open reads as a panel already out; hovering an open one reads as the way back.
	const icon = $derived(open ? (hovered ? IconWindowFillSideArrowRight : IconWindowFillSideRight) : IconWindowSideArrowLeft)

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
</script>

<svelte:window onkeydown={onWindowKeydown} onpointerdown={onWindowPointerdown} />

{#if selection.listable}
	<div bind:this={root} class="relative">
		<Button
			bind:element={toggle}
			variant="filled"
			size="icon"
			{icon}
			title={open ? 'Close chart options' : 'Chart options'}
			aria-expanded={open}
			aria-controls={id}
			onpointerenter={() => (hovered = true)}
			onpointerleave={() => (hovered = false)}
			onclick={() => (open = !open)}
		/>

		<div
			{id}
			class="absolute top-full right-0 z-20 -mt-px max-h-100 w-80 overflow-y-auto border bg-white p-4 dark:border-black-500 dark:bg-black {open
				? ''
				: 'hidden'}"
		>
			<fieldset>
				<legend class="font-semibold">Edit label visibility</legend>

				<ul class="mt-3 flex flex-col">
					{#each selection.rows as row (row.response)}
						{@const off = selection.hidden.includes(row.response)}
						{@const on = selection.focus.includes(row.response)}

						<li class="-mx-4 flex items-start gap-2 px-4 py-2 odd:bg-black-100 dark:odd:bg-white/5">
							<label
								class="flex flex-1 cursor-pointer items-start gap-2 text-sm leading-snug {off ? 'text-black-400 dark:text-black-300' : ''}"
							>
								<input type="checkbox" class="mt-0.5 shrink-0" checked={!off} onchange={() => selection.toggle(row.response)} />
								<span class="select-none">{row.response}</span>
							</label>

							<button
								type="button"
								class="shrink-0 cursor-pointer border px-2 py-0.5 text-xs {on
									? 'bg-black text-white dark:bg-white dark:text-black'
									: 'hover:bg-black-150 dark:border-black-500 dark:hover:bg-black-500'}"
								aria-pressed={on}
								aria-label="Focus {row.response}"
								onclick={() => selection.highlight(row.response)}
							>
								Focus
								<Icon src={on ? IconEyeOff : IconEye} />
							</button>
						</li>
					{/each}
				</ul>
			</fieldset>

			{#if selection.touched}
				<p class="mt-4 border-t pt-3 text-xs dark:border-black-500">
					<button type="button" class="cursor-pointer underline" onclick={() => selection.reset()}>Show every row again</button>
				</p>
			{/if}
		</div>
	</div>
{/if}
