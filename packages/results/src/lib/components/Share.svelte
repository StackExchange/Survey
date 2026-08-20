<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { IconServiceFacebook, IconServiceLinkedIn, IconServiceX } from '@stackoverflow/stacks-icons/icons'

	import Button from '$components/Button.svelte'

	// `title` is what the share text says; `url` is what gets shared.
	let { url, title, class: className }: { url: string; title: string; class?: ClassValue } = $props()

	const text = $derived(encodeURIComponent(title))
	const link = $derived(encodeURIComponent(url))

	const services = $derived([
		{ name: 'X', icon: IconServiceX, href: `https://x.com/intent/tweet?url=${link}&text=${text}&via=stackoverflow` },
		{ name: 'LinkedIn', icon: IconServiceLinkedIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${link}` },
		{ name: 'Facebook', icon: IconServiceFacebook, href: `https://www.facebook.com/sharer/sharer.php?u=${link}&text=${text}` },
	])
</script>

<div class={className}>
	{#each services as service (service.name)}
		<Button href={service.href} external rel="noopener" icon={service.icon} title="Share on {service.name}" variant="plain" size="icon" />
	{/each}
</div>
