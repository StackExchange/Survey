<script lang="ts">
	import MiniMap from './lib/MiniMap.svelte'
	import Pager from './lib/Pager.svelte'
</script>

<MiniMap />

<main class="shell">
	<Pager />
</main>

<style>
	.shell {
		padding: 2rem 1.5rem 5rem;
		box-sizing: border-box;
		min-width: 0;
		width: 66%;
	}
</style>
