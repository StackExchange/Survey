import { error } from '@sveltejs/kit'

import site from '$generated/site.json'
import { getChapter } from '$lib/server/content'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => site.entries.chapter

export const load: PageServerLoad = ({ params }) => {
	const chapter = getChapter(params.chapter)

	if (!chapter) throw error(404, `No chapter "${params.chapter}"`)

	// The first highlight's chart stands in as the chapter's image in JSON-LD.
	const lead = chapter.highlights.find((h: any) => h.kind === 'figure')

	return { chapter }
}
