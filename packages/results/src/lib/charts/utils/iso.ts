import { px } from '$charts/utils/theme'

// Vertical rise per horizontal unit — the 2:1 look.
export const SKEW = 0.5

const UNIT = 100
const H = UNIT / 2
const R = UNIT * SKEW * 0.5

// Stand-in until the artwork lands; replacing these paths is the whole swap.
export const CUBE = {
	top: `M${H} 0 L${UNIT} ${R} L${H} ${R * 2} L0 ${R} Z`,
	left: `M0 ${R} L${H} ${R * 2} L${H} ${R * 2 + H} L0 ${R + H} Z`,
	right: `M${UNIT} ${R} L${UNIT} ${R + H} L${H} ${R * 2 + H} L${H} ${R * 2} Z`,
}

const CUBE_HEIGHT = (R * 2 + H) / UNIT

export const cube = (x: number, y: number, size: number) => `translate(${px(x)} ${px(y)}) scale(${px(size / UNIT, 4)})`

export const cubeHeight = (size: number) => size * CUBE_HEIGHT

// Points rather than a scaled path: scaling an isometric path along one axis
// shears it, and a 30° top edge stops being 30°.
export function slab(x: number, y: number, w: number, h: number, d: number) {
	const rise = px(d * SKEW)
	const at = (a: number, b: number) => `${px(a)} ${px(b)}`

	return {
		top: `M${at(x, y)} L${at(x + w, y)} L${at(x + w + d, y - rise)} L${at(x + d, y - rise)} Z`,
		front: `M${at(x, y)} L${at(x + w, y)} L${at(x + w, y + h)} L${at(x, y + h)} Z`,
		side: `M${at(x + w, y)} L${at(x + w + d, y - rise)} L${at(x + w + d, y + h - rise)} L${at(x + w, y + h)} Z`,
		rise,
	}
}
