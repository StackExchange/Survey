<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { IconLink, IconServiceFacebook, IconServiceLinkedIn, IconServiceX } from '@stackoverflow/stacks-icons/icons'

	import Button from '$components/Button.svelte'
	import ButtonMenu from '$components/ButtonMenu.svelte'

	// `title` is what the share text says; `url` is what gets shared and copied.
	// `compact` drops the labelled half to a lone toggle on narrow screens, for rows that have to stay on one line.
	let { url, title, compact = true, class: className }: { url: string; title: string; compact?: boolean; class?: ClassValue } = $props()

	const text = $derived(encodeURIComponent(title))
	const link = $derived(encodeURIComponent(url))

	const items = $derived([
		{
			name: 'Share on X',
			icon: IconServiceX,
			href: `https://x.com/intent/tweet?url=${link}&text=${text}&via=stackoverflow`,
			external: true,
		},
		{
			name: 'Share on LinkedIn',
			icon: IconServiceLinkedIn,
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,
			external: true,
		},
		{
			name: 'Share on Facebook',
			icon: IconServiceFacebook,
			href: `https://www.facebook.com/sharer/sharer.php?u=${link}&text=${text}`,
			external: true,
		},
	])
</script>

<ButtonMenu {items} label="More share options" class={className}>
	{#snippet action()}
		<Button copy={url} label="Copy link" icon={IconLink} title="Copy this url" class={['text-nowrap', compact && 'max-sm:hidden']} />
	{/snippet}
</ButtonMenu>
