<script lang="ts" module>
	import { surveyPreview } from '$lib/constants'

	// The line under the wording: how it was asked, not what it asked.
	export const askedMeta = (definition: any) =>
		[
			definition.type.replace(/_/g, ' '),
			definition.required ? 'required' : 'optional',
			`v${definition.version}`,
			definition.randomize && 'options randomised',
		]
			.filter(Boolean)
			.join(' · ')

	// The instrument as respondents met it, scrolled to this question.
	export const askedInContext = (definition: any) => `${surveyPreview}/#q-${definition.id}`
</script>

<script lang="ts">
	import { IconEye } from '@stackoverflow/stacks-icons/icons'

	import Icon from './Icon.svelte'
	import Markdown from './Markdown.svelte'

	// 18 of 82 dataIds are crosstabs or DA_/WW_ families with no YAML, so callers
	// guard on there being a definition. Options aren't listed — Country offers 201.
	let { definition, name }: { definition: any; name: string } = $props()
</script>

<div class="bg-blue-extra-light dark:bg-blue-dark relative p-4">
	<Markdown html={definition.titleHtml} class="text-sm" />

	{#if definition.carry_forward?.from}
		<p class="text-black-400 dark:text-black-300 mt-2 text-xs">Options carried forward from {definition.carry_forward.from}.</p>
	{/if}

	<p class="text-black-400 dark:text-black-300 mt-2 text-xs">{askedMeta(definition)}</p>

	<!-- eslint-disable svelte/no-navigation-without-resolve -- the instrument preview, another origin -->
	<a
		aria-label="View in context: {name}"
		class="group hover:bg-black hover:text-white dark:hover:bg-blue-dark bg-blue-light absolute right-0 bottom-0 flex gap-2 px-2 py-2 text-sm text-black"
		href={askedInContext(definition)}
	>
		<span class="hidden pl-1 group-focus:block group-hover:block">View in context</span>
		<Icon src={IconEye} />
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>
