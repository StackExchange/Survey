import site from '$generated/site.json'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => [{ year: site.settings.year }]

export const load: PageServerLoad = () => ({ jsonld: site.jsonld.methodology })
