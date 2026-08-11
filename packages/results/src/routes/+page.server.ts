import { settings } from '$lib/server/content'
import years from '$archive/index.json'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => ({ settings, years })
