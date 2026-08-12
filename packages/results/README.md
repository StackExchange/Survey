# Results site

The survey results site, built with [SvelteKit](https://svelte.dev/docs/kit/introduction) and prerendered to static files. It serves the apex, `survey.stackoverflow.co`.

```bash
npm run dev -w results
npm run build -w results
```

## Site structure

### Earlier years

2015–2025 are static HTML committed under `packages/archive`, moved into this packages by the build script:

```
npm run archive -w results
```
