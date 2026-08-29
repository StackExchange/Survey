import type { EntryGenerator, PageServerLoad } from './$types'

import site from '$generated/site.json'
import year from '$generated/year.json'

export const entries: EntryGenerator = () => [{ year: site.settings.year }]

export const load: PageServerLoad = () => ({
	settings: site.settings,
	stats: site.stats,
	chapters: year.chapters,
	seo: year.seo,
	jsonld: year.jsonld,
})
