<script lang="ts">
	import { browser } from '$app/environment'
	import { promo } from '$lib/constants'

	let dismissed = $state(browser && localStorage.getItem(promo.dismissedKey) === '1')

	const dismiss = () => {
		dismissed = true
		localStorage.setItem(promo.dismissedKey, '1')
	}
</script>

{#if !dismissed && promo.visible}
	<aside aria-label="Announcement" class="bg-blue flex items-center justify-center gap-4 px-4 py-3 text-white">
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external, from $lib/constants -->
		<a class="font-semibold hover:underline" href={promo.url}>{promo.text}</a>

		<button type="button" class="cursor-pointer hover:underline" onclick={dismiss}>
			Close<span class="sr-only"> announcement</span>
		</button>
	</aside>
{/if}
