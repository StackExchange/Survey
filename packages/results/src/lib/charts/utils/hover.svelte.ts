// Which mark the pointer is on, and the readout that goes with it. Fifteen charts
// held this as their own `active` plus an identical four-line `leave`.
//
// `onhover` arrives as a getter for the same reason ../ChartRoot.svelte takes one:
// a chart is mounted once and the host may hand it a different handler later.
// Call during component init.
import type { OnHover, TooltipData } from './tooltip'

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
