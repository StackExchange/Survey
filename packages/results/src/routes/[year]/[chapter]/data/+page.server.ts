import { error } from '@sveltejs/kit'

import site from '$generated/site.json'
import { getChapterData } from '$lib/server/content'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => site.entries.chapter

export const load: PageServerLoad = ({ params }) => {
	const chapter = getChapterData(params.chapter)

	if (!chapter) throw error(404, `No chapter "${params.chapter}"`)

	return { chapter }
}
