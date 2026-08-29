// `onhover` is a getter: a chart is mounted once, but the host may swap it.
import type { OnHover, TooltipData } from './theme'

export function useHover(onhover: () => OnHover | undefined) {
	let active = $state<number | null>(null)

	return {
		/** The index under the pointer, or null. */
		get active() {
			return active
		},

		enter(i: number, data: TooltipData, event: PointerEvent) {
			active = i
			onhover()?.(data, event)
		},

		leave() {
			active = null
			onhover()?.(null)
		},
	}
}
