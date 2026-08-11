<script>
	import Navigation from '$lib/components/Navigation.svelte'
	import QuestionPanel from '$lib/components/QuestionPanel.svelte'

	let { children, data } = $props()
</script>

<Navigation year={data.year} chapters={data.chapters} />

{@render children()}

<QuestionPanel />
