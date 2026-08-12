<script>
	import { resolve } from '$app/paths'
	import { page } from '$app/state'
	import Icon from '$lib/components/Icon.svelte'
	import { Seo } from '$lib/seo'

	import { SpotError404, SpotError500 } from '@stackoverflow/stacks-icons/spots'

	const status = $derived(page.status)
	const message = $derived(page.error?.message ?? '')
	const heading = $derived(status === 404 ? 'That page does not exist' : 'Something went wrong')
	const illo = $derived(status === 404 ? SpotError404 : SpotError500)
</script>

<Seo title={heading} noindex markdown={false} />

<main id="main" class="mx-auto max-w-3xl px-6 py-16 min-h-screen flex flex-col" tabindex="-1">
	<div class="m-auto text-center">
		<Icon src={illo} class="native mb-6" title={status.toString()} />

		<h1 class="font-headline mt-2 text-3xl font-bold">{heading}</h1>

		{#if message}
			<p class="mt-3 text-lg">{message}</p>
		{/if}

		<a class="mt-8 inline-block underline" href={resolve('/')}>Go to home</a>
	</div>
</main>
