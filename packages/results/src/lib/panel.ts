import { goto, preloadData, pushState } from '$app/navigation'

// Shallow routing: the address bar becomes the question's own URL, so the panel
// is shareable and Back closes it. A modified or middle click is left alone.
export async function openQuestion(event: MouseEvent, href: string) {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

	event.preventDefault()

	const result = await preloadData(href)

	if (result.type === 'loaded' && result.status === 200) pushState(href, { question: result.data as App.PageState['question'] })
	else goto(href)
}
