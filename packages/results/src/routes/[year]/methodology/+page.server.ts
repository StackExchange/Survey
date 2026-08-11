import { settings } from '$lib/server/content'
import type { EntryGenerator } from './$types'

export const entries: EntryGenerator = () => [{ year: settings.year }]
