<script lang="ts">
	import type { Question } from '$lib/types'
	import Markdown from './Markdown.svelte'

	let { question }: { question: Question } = $props()
</script>

<div class="display">
	<Markdown content={question.title} />
</div>

<style>
	.display {
	  padding: 3rem;
		font-size: 1rem;
		line-height: 1.5;
	}
</style>
