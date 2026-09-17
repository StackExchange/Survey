<script lang="ts">
	import { IconClipboard, IconDocument, IconServiceClaude, IconServiceOpenAI } from '@stackoverflow/stacks-icons/icons'

	import { dev } from '$app/environment'
	import { page } from '$app/state'

	import { siteUrl } from '$config'

	import Button from '$components/Button.svelte'
	import ButtonMenu from '$components/ButtonMenu.svelte'

	// `compact` drops the labelled half to a lone toggle on narrow screens, for rows that have to stay on one line.
	let { title = 'this page', compact = true }: { title?: string; compact?: boolean } = $props()

	const url = $derived(page.url.pathname === '/' ? '/index.md' : `${page.url.pathname}.md`)

	const shared = $derived(dev ? new URL(url, page.url.origin).href : `${siteUrl}${url}`)

	const prompt = $derived(
		`Read ${shared} — the Stack Overflow Developer Survey results for ${title}, as markdown. Summarise what stands out.`
	)

	const items = $derived([
		{ name: 'View Markdown', href: url, icon: IconDocument, external: true },
		{ name: 'Open Claude', href: `https://claude.ai/new?q=${encodeURIComponent(prompt)}`, icon: IconServiceClaude, external: true },
		{ name: 'Open ChatGPT', href: `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, icon: IconServiceOpenAI, external: true },
	])

	const markdown = async () => {
		const response = await fetch(url)
		if (!response.ok) throw new Error(`${response.status} for ${url}`)

		return response.text()
	}
</script>

<ButtonMenu {items} label="More page options">
	{#snippet action()}
		<Button
			copy={markdown}
			label="Copy page"
			icon={IconClipboard}
			class={['flex-1 justify-center text-nowrap', compact && 'max-sm:hidden']}
		/>
	{/snippet}
</ButtonMenu>
