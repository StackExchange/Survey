import type { EntryGenerator, PageServerLoad } from './$types'

import site from '$generated/site.json'

export const entries: EntryGenerator = () => [{ year: site.settings.year }]

export const load: PageServerLoad = () => ({ jsonld: site.jsonld.methodology })
