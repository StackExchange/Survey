// Chart id → component, keyed by a block's `chart:` in src/content/*.yaml.
//
// Nothing draws a heading: the page has one. Most return a single `<svg>` root
// so the same render works inline and as a file; the ./text ones have no `<svg>`
// and ./export.ts returns null for them, which ChartDownload treats as nothing
// to offer.
import Bar from './standard/Bar.svelte'
import BarClustered from './standard/BarClustered.svelte'
import BarStacked from './standard/BarStacked.svelte'
import Dumbbell from './standard/Dumbbell.svelte'
import Sankey from './standard/Sankey.svelte'
import Scatter from './standard/Scatter.svelte'
import Table from './standard/Table.svelte'

import HeroBarStackedHorizontal from './hero/BarStackedHorizontal.svelte'
import HeroBarStackedMinmax from './hero/BarStackedMinmax.svelte'
import HeroBarStackedVertical from './hero/BarStackedVertical.svelte'
import HeroCube from './hero/Cube.svelte'
import HeroRank from './hero/Rank.svelte'
import HeroStat from './hero/Stat.svelte'
import HeroTreemap from './hero/Treemap.svelte'
import HeroWaffleLarge from './hero/WaffleLarge.svelte'
import HeroWaffleMedium from './hero/WaffleMedium.svelte'

import HighlightBarStackedHorizontal from './highlight/BarStackedHorizontal.svelte'
import HighlightBarStackedMinmax from './highlight/BarStackedMinmax.svelte'
import HighlightBarStackedVertical from './highlight/BarStackedVertical.svelte'
import HighlightRank from './highlight/Rank.svelte'
import HighlightTreemap from './highlight/Treemap.svelte'
import HighlightTreemapSmall from './highlight/TreemapSmall.svelte'
import HighlightWaffleLarge from './highlight/WaffleLarge.svelte'
import HighlightWaffleMedium from './highlight/WaffleMedium.svelte'

import TextStat from './text/Stat.svelte'

import type { OnHover } from '$charts/utils/tooltip'
import type { Component } from 'svelte'

export const charts: Record<string, Component<{ figure: any; width?: number; onhover?: OnHover }>> = {
	// Standard — the "Data" section of a chapter.
	//
	// `bar-clustered`, `dumbbell` and `sankey` are left out on purpose. Their
	// components still read the `plot_metadata` the legacy export carried and have
	// not been rewritten for the tidy row shape, so registering them would draw an
	// empty chart rather than fail. Add the id back with the rewrite.
	bar: Bar,
	'bar-stacked': BarStacked,
	scatter: Scatter,
	table: Table,

	// Hero (3D) — /[year]. One flat record rather than one per tier: the ids don't
	// collide, and everything that walks this map wants all of them.
	'3d-bar-stacked-horizontal': HeroBarStackedHorizontal,
	'3d-bar-stacked-minmax': HeroBarStackedMinmax,
	'3d-bar-stacked-vertical': HeroBarStackedVertical,
	'3d-cube': HeroCube,
	'3d-rank': HeroRank,
	'3d-treemap': HeroTreemap,
	'3d-waffle-large': HeroWaffleLarge,
	'3d-waffle-medium': HeroWaffleMedium,
	'hero-stat': HeroStat,

	// Highlight (2D) — a chapter overview.
	'2d-bar-stacked-horizontal': HighlightBarStackedHorizontal,
	'2d-bar-stacked-minmax': HighlightBarStackedMinmax,
	'2d-bar-stacked-vertical': HighlightBarStackedVertical,
	'2d-treemap': HighlightTreemap,
	'2d-treemap-small': HighlightTreemapSmall,
	'2d-waffle-large': HighlightWaffleLarge,
	'2d-waffle-medium': HighlightWaffleMedium,
	rank: HighlightRank,
	stat: TextStat,
}
