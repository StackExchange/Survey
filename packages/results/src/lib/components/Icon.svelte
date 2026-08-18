<script lang="ts">
	import clsx from 'clsx'
	import type { ClassValue } from 'svelte/elements'

	// stacks-icons ships raw SVG strings, not components — hence the string surgery.
	interface Props {
		src: string
		// Announces the icon instead of hiding it: adds <title>, drops aria-hidden.
		title?: string
		// `class="native"` keeps the icon's own colours rather than currentColor.
		class?: ClassValue
	}

	const { src, title = '', class: className = '' }: Props = $props()

	const svg = $derived.by(() => {
		let svg = src

		// A title makes the icon announced rather than decorative, so aria-hidden goes.
		if (title) {
			svg = svg.replace('</svg>', `<title>${title}</title></svg>`)
			svg = svg.replace(' aria-hidden="true"', '')
		}

		if (className) svg = svg.replace(/class="/, `class="${clsx(className)} `)

		return svg
	})
</script>

{@html svg}
