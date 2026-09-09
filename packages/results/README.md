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

### Sampling large datasets

Some data sets are too large (e.g., write-ins like `SOChangeAddl`), so they must be sampled. Its chapter JSON carries `meta.sampled: true` and a smaller `data` array, and the full rows move to a `{chapter}_{dataId}.json` file in the same `packages/archive/<year>/json/` folder.

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

An individual question and it demographics filter via query string `p`. Its "View in survey" link points at the preview site built from `config.ts`'s `surveyPreview` — that site is access-locked, so the link only resolves for signed-in staff, not anonymous visitors.

## Release process

`main` is the working branch — always the current state of the site's code and content. `releases/<year>` is canonical: what Netlify actually deploys to production. It only moves forward at four points in the year's lifecycle:

1. **Questions finalised** - Survey content is frozen for the year. Merge `main` into `releases/<year>`.
2. **Results site launched** - The results site goes live for the year. Merge the working branch into `main` and that into `releases/<year>` so the canonical branch matches what's deployed.
3. **CSV archives added** - Stack Overflow publishes `results.csv`/`schema.csv`. Add them under `packages/archive/<year>/` alongside the [JSON export](#data) already there, update that year's row in `packages/archive/index.json`, then merge `main` into `releases/<year>`.
4. **Site archived** - Once the year is no longer current, snapshot the live build so it can be served as a [historical year](#earlier-years):
   1. `npm run build -w results`
   2. Copy `packages/results/build/<year>` into `packages/archive/<year>/site`
   3. Commit, then merge `main` into `releases/<year>`.

Between these points, keep working on `main` — `releases/<year>` should never get ahead of it.
