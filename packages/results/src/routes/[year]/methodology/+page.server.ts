import type { EntryGenerator, PageServerLoad } from './$types'

import methodology from '$generated/methodology.json'
import site from '$generated/site.json'

export const entries: EntryGenerator = () => [{ year: site.settings.year }]

export const load: PageServerLoad = () => ({ blocks: methodology.blocks, seo: methodology.seo, jsonld: methodology.jsonld })
