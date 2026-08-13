# Results site

The survey results site, built with [SvelteKit](https://svelte.dev/docs/kit/introduction) and prerendered to static files. It serves the apex, `survey.stackoverflow.co`.

```bash
npm run dev -w results
npm run build -w results
```

## Live preview

```bash
npm run dev -w results
```

## Sync content

Content is stored in a public Google Sheet. To convert this to `src/survey,json` run this command.

```bash
npm run content -w results
```

## Types of graphic

### Expressive

The 3D ("Hero") and 2D ("Highlight") types.

| Concept                                 | Hero (3D)                   | Highlight (2D)              |
| --------------------------------------- | --------------------------- | --------------------------- |
| Magnitude comparison (2 values)         | `3d-cube`                   | `2d-treemap-small`          |
| % of whole (large)                      | `3d-waffle-large`           | `2d-waffle-large`           |
| % of whole ("1 in X")                   | `3d-waffle-medium`          | `2d-waffle-medium`          |
| Proportional areas (multi-category)     | `3d-treemap`                | `2d-treemap`                |
| Categorical breakdown, vertical         | `3d-bar-stacked-vertical`   | `2d-bar-stacked-vertical`   |
| Categorical breakdown, horizontal       | `3d-bar-stacked-horizontal` | `2d-bar-stacked-horizontal` |
| Min/max comparison                      | `3d-bar-stacked-minmax`     | `2d-bar-stacked-minmax`     |
| Ranked Top X                            | `3d-rank`                   | `rank`                      |
| Single stat callout (etc 1/4, 7.5, 85%) | `hero-stat`                 | `stat`                      |
| Respondant quote                        | —                           | `quote`                     |

### Standard

Used in "Data" section of each chapter.

Set per question in the `chart` column of the content sheet, and resolved through
the registry in `src/lib/charts/index.ts` — a value with no entry there draws
nothing, so the ids below are the whole list.

| Type          | uid             | Row shape it draws                                       |
| ------------- | --------------- | -------------------------------------------------------- |
| Bar           | `bar`           | one row per response                                     |
| Bar stacked   | `bar-stacked`   | a row per (response, series); segments sum to 100%       |
| Bar clustered | `bar-clustered` | a row per (response, series); one bar each, shared scale |
| Dumbbell      | `dumbbell`      | a row per (response, series), exactly two series         |
| Sankey        | `sankey`        | a row per (source, target) — `response` → `series`       |
| Scatter       | `scatter`       | one row per response, two named numeric columns          |
| Table         | `table`         | any columns; headings come from `src/lib/labels.ts`      |

## Site structure

The results site has the following heirarchy.

### Earlier years

2015–2025 are static HTML committed under `packages/archive`, moved into this packages by the build script:

```
npm run archive -w results
```

### `/`: Developer Survey index

This is an index to all the previous year’s results. The data comes from `/packages/archive/index.json`.

### `/[year]`: This year’s survey

An editorialised introduction to this year’s survey. Each chapter has ~2 hero infographics design to give an quick overview of the trends and insights. Uses the `Hero (3D)` column of graphics.

## `/[years]/[chapter]`: Chapter overview

~5 key data points from the chapter presented in a less expressive but still infographic approach. Uses the `Highlight (2D)` column of graphics.

## `/[years]/[chapter]/data`: Complete chapter data

The data broadly mapped to the exact question asked, including the option to filters by demographics. Uses the `Standard` list of charts.

## `/[years]/[chapter]/data/[question]?p=[plot_id]`: Question permalink

An individual question and it demographics filter via query string `p`.
