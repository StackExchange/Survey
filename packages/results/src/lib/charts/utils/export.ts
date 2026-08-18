// Draws a chart to a PNG in the browser. The component is mounted off-screen at
// the requested options rather than lifted off the page, so an export can differ
// from what is on screen.
import { mount, unmount } from 'svelte'

import ChartRoot from '$charts/ChartRoot.svelte'
import headlineFont from '$lib/assets/fonts/StackSansHeadline[wght].woff2?url'
import textFont from '$lib/assets/fonts/StackSansText[wght].woff2?url'

import type { Chrome } from '$charts/utils/chrome'
import type { Component } from 'svelte'

const SVG_NS = 'http://www.w3.org/2000/svg'

interface Options {
	figure: any
	/** The SVG's own width. Charts lay out to it, so it changes the design, not the resolution. */
	width?: number
	/** Raster multiplier. Same layout, more pixels. */
	scale?: number
	chrome?: Chrome
	/** Only the PNG needs this, and it costs ~137K of base64. */
	fonts?: boolean
}

const FACES = [
	{ family: 'Stack Sans Text', url: textFont },
	{ family: 'Stack Sans Headline', url: headlineFont },
]

// Spreading a whole font into btoa at once overflows the stack.
function base64(buffer: ArrayBuffer) {
	const bytes = new Uint8Array(buffer)
	let binary = ''
	for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
	return btoa(binary)
}

async function face({ family, url }: (typeof FACES)[number]) {
	const response = await fetch(url)
	if (!response.ok) throw new Error(`${response.status} for ${url}`)

	// `woff2`, not layout.css's `woff2-variations`: the variable axis still works
	// and the plain format string is understood more widely.
	const src = `url(data:font/woff2;base64,${base64(await response.arrayBuffer())}) format('woff2')`

	return `@font-face{font-family:'${family}';font-style:normal;font-weight:200 700;src:${src}}`
}

let embedded: Promise<string> | null = null

// An SVG loaded into an `<img>` is its own sandboxed document and cannot reach
// the page's webfonts, so a PNG falls back to the system font without these.
function fontFaces() {
	embedded ??= Promise.all(FACES.map(face))
		.then((faces) => faces.join(''))
		.catch((error) => {
			// A fallback font is a much smaller problem than no PNG at all.
			console.error('chart export: fonts not embedded', error)
			return ''
		})

	return embedded
}

// Figma reads `font-family` off the text node itself and ignores both the
// ancestor and the embedded `@font-face`, so it gets flattened on the way out.
function inlineFontFamily(svg: SVGElement) {
	for (const text of svg.querySelectorAll('text')) {
		// `closest` returns the node itself when it already carries one, so the
		// headline faces keep theirs.
		const family = text.closest('[font-family]')?.getAttribute('font-family')
		if (family) text.setAttribute('font-family', family)
	}
}

export async function toSvg(Chart: Component<any>, { figure, width = 800, chrome = {}, fonts = false }: Options) {
	const faces = fonts ? await fontFaces() : ''

	const host = document.createElement('div')
	host.setAttribute('aria-hidden', 'true')
	host.style.cssText = 'position:fixed;top:0;left:-10000px;pointer-events:none'
	document.body.append(host)

	const app = mount(ChartRoot, { target: host, props: { chart: Chart, figure, width, chrome } })

	try {
		const svg = host.querySelector('svg')
		if (!svg) return null

		inlineFontFamily(svg)

		if (faces) {
			const style = document.createElementNS(SVG_NS, 'style')
			style.textContent = faces
			svg.prepend(style)
		}

		const box = svg.viewBox.baseVal
		return {
			markup: new XMLSerializer().serializeToString(svg),
			width: box.width || width,
			height: box.height || Number(svg.getAttribute('height')) || width,
		}
	} finally {
		unmount(app)
		host.remove()
	}
}

export async function toPng(Chart: Component<any>, options: Options) {
	const svg = await toSvg(Chart, { ...options, fonts: true })
	if (!svg) return null

	const scale = options.scale ?? 2

	// A data URL rather than a blob URL: Safari treats a canvas that drew a
	// blob-backed SVG as tainted and refuses to read it back.
	const image = new Image()
	image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.markup)}`
	await image.decode()

	const canvas = document.createElement('canvas')
	canvas.width = Math.round(svg.width * scale)
	canvas.height = Math.round(svg.height * scale)
	canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)

	return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export function save(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	link.click()
	// Not synchronous: Firefox has been known to cancel the download if the URL
	// goes away in the same task as the click.
	setTimeout(() => URL.revokeObjectURL(url), 0)
}
