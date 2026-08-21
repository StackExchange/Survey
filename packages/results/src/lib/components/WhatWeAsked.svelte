<script lang="ts" module>
	import { surveyPreview } from '$config'

	// How a question was asked, not what it asked — the facts that sit under the
	// wording. A list rather than a sentence: every caller renders them as one run
	// of separated chips, so the separator belongs to the CSS, not to the string.
	export const askedFacts = (definition: any): string[] =>
		[
			definition.type.replace(/_/g, ' '),
			definition.required ? 'required' : 'optional',
			`v${definition.version}`,
			definition.randomize && 'options randomised',
			definition.carry_forward?.from && `options carried forward from ${definition.carry_forward.from}`,
		].filter(Boolean)

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

<div class="relative bg-blue-extra-light p-4 dark:bg-blue-light dark:text-black">
	<div class="md text-sm">{@html definition.titleHtml}</div>

	<ul class="mt-2 flex flex-wrap text-xs text-black-400">
		{#each askedFacts(definition) as fact (fact)}
			<li class="not-first:before:mx-2 not-first:before:content-['\25aa']">{fact}</li>
		{/each}
	</ul>

	<a
		aria-label="View in context: {name}"
		class="group absolute right-0 bottom-0 flex gap-2 bg-blue-light px-2 py-2 text-sm text-black hover:bg-black hover:text-white dark:hover:bg-blue-dark"
		href={askedInContext(definition)}
	>
		<span class="hidden pl-1 group-hover:block group-focus:block">View in context</span>
		<Icon src={IconEye} />
	</a>
</div>
