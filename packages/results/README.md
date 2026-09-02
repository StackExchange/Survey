# Results site

The survey results site, built with [SvelteKit](https://svelte.dev/docs/kit/introduction) and prerendered to static files. It serves the apex, `survey.stackoverflow.co`.

```bash
# Live preview at http://localhost:5173/
npm run dev -w results

# Optionally serve on your home network - useful for mobile testing
npm run dev -w results -- --host

# For production
npm run build -w results

# As with the whole repo, run this before commiting
npm run format
```

## Sync content

Content is stored in a Google Sheet that must be public (so we don't need API keys to read it). To convert this to `survey.json` run this command.

```bash
npm run content -w results
```

## Data

`scripts/data.js` bakes three inputs into one payload per route:

| Input                                 | What it is                                         |
| ------------------------------------- | -------------------------------------------------- |
| `packages/archive/<year>/json/*.json` | The year's export, one file per chapter            |
| `survey.json`                         | Editorial copy, synced from the Google Sheet above |
| `questions/`                          | The question bank, for wording and short labels    |

Which year it reads comes from `settings.year` in `survey.json`, so rolling over is a sheet change plus a new archive folder.

Output goes to `src/generated/` and is not checked in — the Vite plugin in `vite.config.js` rebuilds it on every dev start and build, so it cannot go stale. To run it alone:

```bash
npm run data -w results
```

## Types of graphic

### Expressive

The 3D ("Hero") and 2D ("Highlight") types. The `Tier` column of the Features tab
picks the page, and so the column below: `homepage` draws the 3D set, `chapter` the
2D set, and `hold` publishes nowhere. The older names `hero` and `highlight` still
work, so the sheet can be renamed a row at a time.

| Concept                                 | `homepage` — Hero (3D)      | `chapter` — Highlight (2D)  |
| --------------------------------------- | --------------------------- | --------------------------- |
| Magnitude comparison (2 values)         | `3d-cube`                   | `2d-treemap-small`          |
| % of whole (large)                      | `3d-waffle-large`           | `2d-waffle-large`           |
| % of whole ("1 in X")                   | `3d-waffle-medium`          | `2d-waffle-medium`          |
| Proportional areas (multi-category)     | `3d-treemap`                | `2d-treemap`                |
| Categorical breakdown, vertical         | `3d-bar-stacked-vertical`   | `2d-bar-stacked-vertical`   |
| Categorical breakdown, horizontal       | `3d-bar-stacked-horizontal` | `2d-bar-stacked-horizontal` |
| Ranked list                             | —                           | `rank`                      |
| Single stat callout (etc 1/4, 7.5, 85%) | —                           | `stat`                      |
| Respondant quote                        | —                           | `quote`                     |

### Standard

Used in "Data" section of each chapter.

Set per question in the `chart` column of the content sheet, and resolved through
the registry in `src/lib/charts/index.ts` — a value with no entry there draws
nothing, so the ids below are the whole list.

| Type          | uid             | Row shape it draws                                             |
| ------------- | --------------- | -------------------------------------------------------------- |
| Bar           | `bar`           | one row per response                                           |
| Bar vertical  | `bar-vertical`  | one row per response, ideal for histograms                     |
| Bar stacked   | `bar-stacked`   | a row per (response, series); segments sum to 100%             |
| Bar clustered | `bar-clustered` | a row per (response, series); one bar each, shared scale       |
| Dumbbell      | `dumbbell`      | a row per (response, series), exactly two series               |
| Sankey        | `sankey`        | a row per (source, target) — `response` → `series`             |
| Scatter       | `scatter`       | one row per response, two named numeric columns                |
| Table         | `table`         | any columns; headings come from `src/lib/labels.ts`            |
| Line          | `line`          | a row per (response, series), trend over an ordered `response` |

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

An editorialised introduction to this year’s survey. Each chapter has ~2 hero infographics design to give an quick overview of the trends and insights. Set by `tier: homepage` in the sheet, which uses the `Hero (3D)` column of graphics.

## `/[years]/[chapter]`: Chapter overview

~5 key data points from the chapter presented in a less expressive but still infographic approach. Set by `tier: chapter` in the sheet, which uses the `Highlight (2D)` column of graphics.

## `/[years]/[chapter]/data`: Complete chapter data

The data broadly mapped to the exact question asked, including the option to filters by demographics. Uses the `Standard` list of charts.

## `/[years]/[chapter]/data/[question]?p=[plot_id]`: Question permalink

An individual question and it demographics filter via query string `p`.
