import { getChapters, settings } from '$lib/server/content'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => [{ year: settings.year }]

export const load: PageServerLoad = () => ({ settings, chapters: getChapters() })
