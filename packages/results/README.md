# Results site

The survey results site, built with [SvelteKit](https://svelte.dev/docs/kit/introduction) and prerendered to static files. It serves the apex, `survey.stackoverflow.co`.

```bash
npm run dev -w results
npm run build -w results
```

## Deploys

Netlify, from the repo root so that the install honours the root `package-lock.json`:

| Setting        | Value                    |
| -------------- | ------------------------ |
| Base directory | _(repo root)_            |
| Build command  | `npm run build -w results` |
| Publish        | `packages/results/build` |

There is no `netlify.toml` — headers and redirects are `static/_headers` and
`static/_redirects`, which Netlify reads from the publish directory whatever the
base is, so the config travels with the package. Node is pinned by `.nvmrc` at the
repo root.

## Site structure

Being migrated a page at a time. What is here so far:

### `/`: Developer Survey index

An index of every year's results, from `packages/archive/index.json`. A year with a
`results` URL is published and listed; the newest one leads the page. `null` means
not published yet, so setting 2026's URL is what puts that year at the top.

`/index.md` is the markdown twin of this page, linked from `<head>` as
`rel="alternate"`; `/sitemap.xml` covers it and each published year.

### Earlier years

2011–2025 live in `packages/archive` and are proxied through by the redirects in
`netlify.toml` — they are not built here. Response data (`results.csv`,
`schema.csv`, `survey.pdf`) redirects to GitHub.

## Still to port

From the `2026-results-site` branch: `/[year]`, `/[year]/[chapter]`, the chapter
data pages and question permalinks, the `$charts` tree, and the Google Sheet
content pipeline (`scripts/gsheet.js` → `src/content`, `src/data`).
