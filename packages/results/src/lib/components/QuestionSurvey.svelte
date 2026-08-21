<script lang="ts" module>
	export const askedFacts = (definition: any): string[] =>
		[
      definition.dataId,
			definition.type.replace(/_/g, ' '),
			definition.required ? 'required' : 'optional',
			`v${definition.version}`,
			definition.randomize && 'options randomised',
			definition.carry_forward?.from && `options carried forward from ${definition.carry_forward.from}`,
		].filter(Boolean)
</script>

<script lang="ts">
	let { definition }: { definition: any; name: string } = $props()
</script>

<div class="relative bg-blue-extra-light p-4 dark:bg-blue-light dark:text-black">
	<div class="md text-sm">{@html definition.titleHtml}</div>

	<ul class="mt-2 flex flex-wrap text-xs text-black-400">
		{#each askedFacts(definition) as fact (fact)}
			<li class="not-first:before:mx-2 not-first:before:content-['\25aa']">{fact}</li>
		{/each}
	</ul>
</div>
