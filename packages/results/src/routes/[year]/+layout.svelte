<script>
	import Navigation from '$components/Navigation.svelte'
	import QuestionPanel from '$components/QuestionPanel.svelte'

	let { children, data } = $props()
</script>

<Navigation year={data.year} chapters={data.chapters} />

{@render children()}

<QuestionPanel />
