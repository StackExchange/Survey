// Nothing draws a heading: the page has one. The ./text ones have no `<svg>`.
import type { OnHover } from '$charts/utils/tooltip'
import type { Component } from 'svelte'

import BarStackedHorizontal2d from './2d/BarStackedHorizontal.svelte'
import BarStackedVertical2d from './2d/BarStackedVertical.svelte'
import Rank2d from './2d/Rank.svelte'
import Treemap2d from './2d/Treemap.svelte'
import TreemapSmall2d from './2d/TreemapSmall.svelte'
import WaffleLarge2d from './2d/WaffleLarge.svelte'
import WaffleMedium2d from './2d/WaffleMedium.svelte'
import BarStackedHorizontal3d from './3d/BarStackedHorizontal.svelte'
import BarStackedVertical3d from './3d/BarStackedVertical.svelte'
import Cube3d from './3d/Cube.svelte'
import Treemap3d from './3d/Treemap.svelte'
import WaffleLarge3d from './3d/WaffleLarge.svelte'
import WaffleMedium3d from './3d/WaffleMedium.svelte'
import Bar from './standard/Bar.svelte'
import BarClustered from './standard/BarClustered.svelte'
import BarStacked from './standard/BarStacked.svelte'
import BarVertical from './standard/BarVertical.svelte'
import Dumbbell from './standard/Dumbbell.svelte'
import Sankey from './standard/Sankey.svelte'
import Scatter from './standard/Scatter.svelte'
import Table from './standard/Table.svelte'
import TextStat from './text/Stat.svelte'

export const charts: Record<string, Component<{ figure: any; width?: number; onhover?: OnHover }>> = {
	// Standard — the "Data" section of a chapter.
	bar: Bar,
	'bar-stacked': BarStacked,
	'bar-clustered': BarClustered,
	'bar-vertical': BarVertical,
	dumbbell: Dumbbell,
	scatter: Scatter,
	sankey: Sankey,
	table: Table,

	// 3D — /[year], the `home` tier. One flat record: the ids don't collide.
	'3d-bar-stacked-horizontal': BarStackedHorizontal3d,
	'3d-bar-stacked-vertical': BarStackedVertical3d,
	'3d-cube': Cube3d,
	'3d-treemap': Treemap3d,
	'3d-waffle-large': WaffleLarge3d,
	'3d-waffle-medium': WaffleMedium3d,

	// 2D — a chapter overview, the `chapter` tier.
	'2d-bar-stacked-horizontal': BarStackedHorizontal2d,
	'2d-bar-stacked-vertical': BarStackedVertical2d,
	'2d-treemap': Treemap2d,
	'2d-treemap-small': TreemapSmall2d,
	'2d-waffle-large': WaffleLarge2d,
	'2d-waffle-medium': WaffleMedium2d,
	rank: Rank2d,
	stat: TextStat,
}

// Which ids answer the "scale to the largest value" option: `useDomain()` callers.
export const SCALABLE = new Set(['bar', 'bar-clustered', 'bar-vertical', 'dumbbell'])
