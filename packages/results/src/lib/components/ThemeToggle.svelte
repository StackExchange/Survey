<script lang="ts">
	import { IconTheme, IconThemeDark, IconThemeLight } from '@stackoverflow/stacks-icons/icons'
	import { setMode, userPrefersMode } from 'mode-watcher'

	import Icon from '$lib/components/Icon.svelte'

	let { class: className = '' }: { class?: string } = $props()

	// `userPrefersMode`, not `mode`: the latter is the resolved light/dark and would
	// show 'system' as whichever it currently resolves to.
	const options = [
		{ value: 'light', name: 'Light', icon: IconThemeLight },
		{ value: 'dark', name: 'Dark', icon: IconThemeDark },
		{ value: 'system', name: 'System', icon: IconTheme },
	] as const
</script>

<fieldset class="flex items-stretch bg-black text-white {className} mr-2">
	<legend class="sr-only">Colour theme</legend>

	{#each options as option (option.value)}
		<label class="flex cursor-pointer items-stretch" title={option.name}>
			<input
				class="peer sr-only"
				type="radio"
				name="theme"
				value={option.value}
				checked={userPrefersMode.current === option.value}
				onchange={() => setMode(option.value)}
			/>
			<span
				class="flex items-center px-3 py-3 peer-checked:bg-black-500 peer-checked:text-black peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-orange"
			>
				<Icon src={option.icon} class="text-white" />
				<span class="sr-only">{option.name}</span>
			</span>
		</label>
	{/each}
</fieldset>
