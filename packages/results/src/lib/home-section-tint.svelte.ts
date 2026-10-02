import type { Attachment } from 'svelte/attachments'

const ROOT_MARGIN = '-50% 0px -50% 0px'
const FADE = 250

export function tinting() {
	let holding = $state(0)

	const ground: Attachment<HTMLElement> = (node) => {
		let shown: boolean | undefined
		let fading: ReturnType<typeof setTimeout> | undefined

		$effect(() => {
			const next = holding > 0

			if (shown !== undefined && shown !== next) {
				node.classList.add('theme-fade')

				clearTimeout(fading)
				fading = setTimeout(() => node.classList.remove('theme-fade'), FADE)
			}

			shown = next
			node.classList.toggle('theme-tint', next)
		})

		return () => clearTimeout(fading)
	}

	const trigger =
		(enabled = true): Attachment<HTMLElement> =>
		(node) => {
			if (!enabled || typeof IntersectionObserver === 'undefined') return

			let counted = false

			const observer = new IntersectionObserver(
				([entry]) => {
					if (entry.isIntersecting === counted) return

					counted = entry.isIntersecting
					holding += counted ? 1 : -1
				},
				{ rootMargin: ROOT_MARGIN }
			)

			observer.observe(node)

			return () => {
				observer.disconnect()
				if (counted) holding -= 1
			}
		}

	return { ground, trigger }
}
