import years from '$archive/index.json'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => ({ years })
