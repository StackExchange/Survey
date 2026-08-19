import type { PageServerLoad } from './$types'

import years from '$archive/index.json'
import site from '$generated/site.json'

export const load: PageServerLoad = () => ({ settings: site.settings, years, jsonld: site.jsonld })
