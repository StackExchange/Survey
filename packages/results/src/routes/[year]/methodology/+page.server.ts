import type { EntryGenerator, PageServerLoad } from './$types'

import site from '$generated/site.json'

export const entries: EntryGenerator = () => [{ year: site.settings.year }]

export const load: PageServerLoad = () => ({ seo: site.seo.methodology, jsonld: site.jsonld.methodology })
