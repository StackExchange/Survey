<script lang="ts">
	import type { Chrome } from '$charts/utils/chrome'
	import type { OnHover } from '$charts/utils/tooltip'
	import type { Component } from 'svelte'

	import { setChrome } from '$charts/utils/chrome'

	// A chart with whatever an export adds around it. Shared by Figure on the page
	// and ./utils/export.ts off-screen, where Figure's own `<figure>` and tooltip
	// are no use. The chrome reaches Wrap by context rather than through 26
	// components' props.
	let { chart, figure, width, chrome, onhover }: { chart: Component<any>; figure: any; width: number; chrome: Chrome; onhover?: OnHover } =
		$props()

	// A getter, so the preview can change options without remounting.
	setChrome(() => chrome)

	const Chart = $derived(chart)
</script>

<Chart {figure} {width} {onhover} />
