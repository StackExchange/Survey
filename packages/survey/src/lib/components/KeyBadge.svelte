<script lang="ts">
	let { value }: { value: string } = $props()
</script>

<code class="kbadge" title="Option key (referenced by show_if)">{value}</code>

<style>
	.kbadge {
		font-size: 0.7em;
		padding: 0.05rem 0.35rem;
		background: rgba(127, 127, 127, 0.15);
		color: inherit;
		opacity: 0.7;
		margin-left: 0.4rem;
	}
</style>
