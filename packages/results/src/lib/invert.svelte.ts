import type { Attachment } from 'svelte/attachments'

// The ground under a run of sections, inverted while one of the marked ones holds
// the screen. The whole run flips rather than the single section, so there is no
// box edge scrolling past — the page itself reads as having changed.
//
// `.theme-invert` does the work: layout.css keys both the `dark:` variant and the
// `--chart-*` tokens off it, so headers, cards and charts follow without being
// handed a theme. Inverted rather than darkened because the reader already chose
// the page ground.

// Half a viewport top and bottom, so the swap lands as a section crosses the
// middle of the screen rather than the moment its first pixel appears.
const ROOT_MARGIN = '-50% 0px -50% 0px'

// Matches the .theme-fade transition in layout.css. That rule sits inside a
// prefers-reduced-motion query, so a reader who asked for no motion gets the swap
// with no crossfade and needs no branch here.
const FADE = 250

export function inversion() {
	// A count rather than a flag: on a viewport short enough for two marked
	// sections to overlap the middle, the ground stays inverted until the last one
	// leaves.
	let holding = $state(0)

	// On the element that carries the ground.
	const ground: Attachment<HTMLElement> = (node) => {
		let shown: boolean | undefined
		let fading: ReturnType<typeof setTimeout> | undefined

		$effect(() => {
			const next = holding > 0

			// Not on the first run: `.theme-fade` transitions everything underneath it,
			// so leaving it on would catch first paint and every hover state inside.
			if (shown !== undefined && shown !== next) {
				node.classList.add('theme-fade')

				clearTimeout(fading)
				fading = setTimeout(() => node.classList.remove('theme-fade'), FADE)
			}

			shown = next
			node.classList.toggle('theme-invert', next)
		})

		return () => clearTimeout(fading)
	}

	// On each section that should pull the ground over. `enabled` is false for the
	// ones that leave it alone, since an attachment cannot be applied conditionally.
	const trigger =
		(enabled = true): Attachment<HTMLElement> =>
		(node) => {
			// Without an observer the run keeps the page ground, which is legible on
			// its own — the inversion is decoration.
			if (!enabled || typeof IntersectionObserver === 'undefined') return

			let counted = false

			const observer = new IntersectionObserver(
				([entry]) => {
					// The observer also fires on resize and on layout shifts; only a real
					// crossing should move the count.
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
