<script lang="ts">
	import { SpotError404, SpotError500 } from '@stackoverflow/stacks-icons/spots'

	import { resolve } from '$app/paths'

	import Button from '$components/Button.svelte'
	import Icon from '$components/Icon.svelte'
	import Seo from '$components/Seo.svelte'

	interface Props {
		status: number
		message?: string
	}

	let { status, message = '' }: Props = $props()

	const heading = $derived(status === 404 ? 'Page not found' : 'Something went wrong')
	const illo = $derived(status === 404 ? SpotError404 : SpotError500)
</script>

<Seo title={heading} noindex markdown={false} />

<main id="main" class="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16" tabindex="-1">
	<div class="m-auto text-center">
		<Icon src={illo} class="native mb-6 h-auto max-w-full" title={status.toString()} />

		<h1 class="mt-8 font-headline text-3xl font-semibold">{heading}</h1>

		{#if message}
			<p class="mt-2 mb-2 text-base">{message}</p>
		{/if}

		<Button class="mt-6" href={resolve('/')} variant="filled">Go to homepage</Button>
	</div>
</main>
