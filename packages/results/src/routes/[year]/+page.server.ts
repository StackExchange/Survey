import site from '$generated/site.json'
import year from '$generated/year.json'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => [{ year: site.settings.year }]

export const load: PageServerLoad = () => ({ settings: site.settings, stats: site.stats, chapters: year.chapters, jsonld: year.jsonld })
