import type { OnHover, TooltipData } from './theme'

export const opens = (event: PointerEvent) => event.pointerType !== 'touch' || event.type === 'pointerdown'

export const closes = (event?: PointerEvent) => !event || event.pointerType !== 'touch' || event.type === 'pointercancel'

export function useDismiss(clear: () => void) {
	$effect(() => {
		const dismiss = (event: PointerEvent) => {
			if (event.pointerType === 'touch') clear()
		}

		window.addEventListener('pointerdown', dismiss, true)
		return () => window.removeEventListener('pointerdown', dismiss, true)
	})
}

export function useHover(onhover: () => OnHover | undefined) {
	let active = $state<number | null>(null)

	const clear = () => {
		if (active === null) return
		active = null
		onhover()?.(null)
	}

	useDismiss(clear)

	return {
		/** The index under the pointer, or null. */
		get active() {
			return active
		},

		enter(i: number, data: TooltipData, event: PointerEvent) {
			if (!opens(event)) return
			active = i
			onhover()?.(data, event)
		},

		leave(event?: PointerEvent) {
			if (closes(event)) clear()
		},
	}
}
