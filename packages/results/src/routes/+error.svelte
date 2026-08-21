<script>
	import { page } from '$app/state'

	import ErrorState from '$components/ErrorState.svelte'
</script>

<ErrorState status={page.status} message={page.error?.message ?? ''} />
