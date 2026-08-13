<script lang="ts" module>
	import { surveyPreview } from '$config'

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

	// 18 of 82 dataIds are crosstabs or DA_/WW_ families with no YAML, so callers
	// guard on there being a definition. Options aren't listed — Country offers 201.
	let { definition, name }: { definition: any; name: string } = $props()
</script>

<div class="relative bg-blue-extra-light p-4 dark:bg-blue-dark">
	<div class="md text-sm">{@html definition.titleHtml}</div>

	{#if definition.carry_forward?.from}
		<p class="mt-2 text-xs text-black-400 dark:text-black-300">Options carried forward from {definition.carry_forward.from}.</p>
	{/if}

	<p class="mt-2 text-xs text-black-400 dark:text-black-300">{askedMeta(definition)}</p>

	<a
		aria-label="View in context: {name}"
		class="group absolute right-0 bottom-0 flex gap-2 bg-blue-light px-2 py-2 text-sm text-black hover:bg-black hover:text-white dark:hover:bg-blue-dark"
		href={askedInContext(definition)}
	>
		<span class="hidden pl-1 group-hover:block group-focus:block">View in context</span>
		<Icon src={IconEye} />
	</a>
</div>
