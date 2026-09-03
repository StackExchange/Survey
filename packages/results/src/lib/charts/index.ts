import type { OnHover } from '$charts/utils/theme'
import type { Component } from 'svelte'

import BarStackedHorizontal2d from './2d/BarStackedHorizontal.svelte'
import BarStackedVertical2d from './2d/BarStackedVertical.svelte'
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
import Line from './standard/Line.svelte'
import Sankey from './standard/Sankey.svelte'
import Scatter from './standard/Scatter.svelte'
import Table from './standard/Table.svelte'
import TextQuotes from './text/Quotes.svelte'
import TextRank from './text/Rank.svelte'
import TextStat from './text/Stat.svelte'
import { rowsOf } from './utils/expressive'

export const charts: Record<string, Component<{ figure: any; width?: number; onhover?: OnHover }>> = {
	// Standard: /[year]/[chapter]/data, /[year]/[chapter]/[question]data
	bar: Bar,
	'bar-stacked': BarStacked,
	'bar-clustered': BarClustered,
	'bar-vertical': BarVertical,
	dumbbell: Dumbbell,
	line: Line,
	scatter: Scatter,
	sankey: Sankey,
	table: Table,
	quotes: TextQuotes,

	// 3D: /[year]
	'3d-bar-stacked-horizontal': BarStackedHorizontal3d,
	'3d-bar-stacked-vertical': BarStackedVertical3d,
	'3d-cube': Cube3d,
	'3d-treemap': Treemap3d,
	'3d-waffle-large': WaffleLarge3d,
	'3d-waffle-medium': WaffleMedium3d,

	// 2D: /[year]/[chapter]
	'2d-bar-stacked-horizontal': BarStackedHorizontal2d,
	'2d-bar-stacked-vertical': BarStackedVertical2d,
	'2d-treemap': Treemap2d,
	'2d-treemap-small': TreemapSmall2d,
	'2d-waffle-large': WaffleLarge2d,
	'2d-waffle-medium': WaffleMedium2d,
	rank: TextRank,
	stat: TextStat,
}

// "Scale to the largest value" chart download option
export const SCALABLE = new Set(['bar', 'bar-clustered', 'bar-vertical', 'dumbbell'])

// "Focus" responses for chart downloading, see useFocus()
export const FOCUSABLE = new Set(['bar', 'bar-stacked', 'bar-clustered', 'bar-vertical', 'dumbbell', 'scatter', 'table'])

// Charts which are complex so should scroll on smaller scrolls rather than be fully responsive
export const SCROLLS = new Set(['line', 'scatter', 'sankey'])

// No <svg> to draw, scale or export as an image.
export const TEXT_ONLY = new Set(['quotes'])

// Guard against really long row counts where things will break
export const PREVIEW_LIMIT = 500

// Decide if we show customize / download image / preview etc
export const isExportable = (figure: any) => !TEXT_ONLY.has(figure?.chart) && rowsOf(figure).length <= PREVIEW_LIMIT
