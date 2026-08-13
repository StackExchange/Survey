import site from '$generated/site.json'
import years from '$archive/index.json'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => ({ settings: site.settings, years, jsonld: site.jsonld })
