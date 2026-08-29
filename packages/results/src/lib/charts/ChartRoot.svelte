<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'
	import type { OnHover } from '$charts/utils/theme'
	import type { Component } from 'svelte'

	import { setChrome } from '$charts/utils/chrome'

	let { chart, figure, width, chrome, onhover }: { chart: Component<any>; figure: any; width: number; chrome: Chrome; onhover?: OnHover } =
		$props()

	// A getter, so the preview can change options without remounting.
	setChrome(() => chrome)

	const Chart = $derived(chart)
</script>

<Chart {figure} {width} {onhover} />
