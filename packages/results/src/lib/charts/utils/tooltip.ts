// A prop, not a context: ./export.ts mounts a chart with no host to report to.
interface TooltipRow {
	value: string
	label?: string
	color?: string
}

export interface TooltipData {
	// The full, unclipped category, often longer than the chart could draw.
	title: string
	rows: TooltipRow[]
}

export type OnHover = (data: TooltipData | null, event?: PointerEvent) => void

// Hit areas are at least this tall, so a thin mark stays catchable.
export const HIT = 24
