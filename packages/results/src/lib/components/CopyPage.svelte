<script lang="ts">
	import { dev } from '$app/environment'
	import { page } from '$app/state'
	import { IconClipboard, IconDocument, IconServiceClaude, IconServiceOpenAI } from '@stackoverflow/stacks-icons/icons'

	import Button from '$lib/components/Button.svelte'
	import ButtonMenu from '$lib/components/ButtonMenu.svelte'
	import { siteUrl } from '$lib/constants'

	let { title = 'this page' }: { title?: string } = $props()


	const shared = $derived(dev ? new URL(url, page.url.origin).href : `${siteUrl}${url}`)

	const prompt = $derived(
		`Read ${shared} — the Stack Overflow Developer Survey results for ${title}, as markdown — and summarise what stands out.`
	)

	const items = $derived([
		{ name: 'Open as Markdown', href: url, icon: IconDocument, external: true },
		{ name: 'Open in Claude', href: `https://claude.ai/new?q=${encodeURIComponent(prompt)}`, icon: IconServiceClaude, external: true },
		{ name: 'Open in ChatGPT', href: `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, icon: IconServiceOpenAI, external: true },
	])

	const markdown = async () => {
		const response = await fetch(url)
		if (!response.ok) throw new Error(`${response.status} for ${url}`)
		return response.text()
	}
</script>

<ButtonMenu {items} label="More page options" class="self-end">
	{#snippet action()}
		<Button copy={markdown} label="Copy page" icon={IconClipboard} class="max-lg:hidden bg-white" />
	{/snippet}
</ButtonMenu>
