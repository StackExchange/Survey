<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { IconLink, IconServiceFacebook, IconServiceLinkedIn, IconServiceX } from '@stackoverflow/stacks-icons/icons'

	import Button from '$components/Button.svelte'
	import ButtonMenu from '$components/ButtonMenu.svelte'

	// `title` is what the share text says; `url` is what gets shared and copied.
	// `compact` drops the labelled half to a lone toggle on narrow screens, for rows that have to stay on one line.
	let { url, title, compact = true, class: className }: { url: string; title: string; compact?: boolean; class?: ClassValue } = $props()

	const items = $derived([
		{
			name: 'X',
			href: `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}&via=stackoverflow`,
			external: true,
		},
		{
			name: 'LinkedIn',
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
			external: true,
		},
		{
			name: 'Facebook',
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
			external: true,
		},
		{
			name: 'WhatsApp',
			href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
			external: true,
		},
		{
			name: 'Reddit',
			href: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
			external: true,
		},
		{
			name: 'Threads',
			href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`,
			external: true,
		},
		{
			name: 'Bluesky',
			href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title} ${url}`)}`,
			external: true,
		},
		{
			name: 'Email',
			href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
			external: true,
		},
	])
</script>

<ButtonMenu {items} label="More share options" class={className}>
	{#snippet action()}
		<Button
			copy={url}
			icon={IconLink}
			label="Copy link"
			title="Copy this url"
			class={['flex-1 justify-center text-nowrap', compact && 'max-sm:hidden']}
		/>
	{/snippet}
</ButtonMenu>
