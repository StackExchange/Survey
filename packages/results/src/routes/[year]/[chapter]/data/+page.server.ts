import { error } from '@sveltejs/kit'

import { getChapterData, listChapters, settings } from '$lib/server/content'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => listChapters().map(({ id }) => ({ year: settings.year, chapter: id }))

export const load: PageServerLoad = ({ params }) => {
	const chapter = getChapterData(params.chapter, { groups: true })

	if (!chapter) throw error(404, `No chapter "${params.chapter}"`)

	return { chapter }
}
