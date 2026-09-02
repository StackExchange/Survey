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
			name: 'X',
			href: `https://x.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}&via=stackoverflow`,
			external: true,
		},
		{
			name: 'LinkedIn',
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
			external: true,
		},
		{
			name: 'Facebook',
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
			external: true,
		},
		{
			name: 'WhatsApp',
			href: `https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`,
			external: true,
		},
		{
			name: 'Reddit',
			href: `https://www.reddit.com/submit?url=${encodeURIComponent(link)}&title=${encodeURIComponent(text)}`,
			external: true,
		},
		{
			name: 'Threads',
			href: `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${link}`)}`,
			external: true,
		},
		{
			name: 'Bluesky',
			href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${link}`)}`,
			external: true,
		},
		{
			name: 'Email',
			href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(link)}`,
			external: true,
		},
	])
</script>

<ButtonMenu {items} label="More share options" class={className}>
	{#snippet action()}
		<Button copy={url} icon={IconLink} label="Copy link" title="Copy this url" class={['text-nowrap', compact && 'max-sm:hidden']} />
	{/snippet}
</ButtonMenu>
