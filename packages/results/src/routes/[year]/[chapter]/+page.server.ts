import type { EntryGenerator, PageServerLoad } from './$types'

import { error } from '@sveltejs/kit'

import site from '$generated/site.json'
import { getChapter } from '$lib/server/content'

export const entries: EntryGenerator = () => site.entries.chapter

export const load: PageServerLoad = ({ params }) => {
	const chapter = getChapter(params.chapter)

	if (!chapter) throw error(404, `No chapter "${params.chapter}"`)

	return { chapter }
}
