import { error } from '@sveltejs/kit'

import { getChapter, listChapters, settings } from '$lib/server/content'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => listChapters().map(({ id }) => ({ year: settings.year, chapter: id }))

export const load: PageServerLoad = ({ params }) => {
	const chapter = getChapter(params.chapter)

	if (!chapter) throw error(404, `No chapter "${params.chapter}"`)

	// The first highlight's chart stands in as the chapter's image in JSON-LD.
	const lead = chapter.highlights.find((h: any) => h.kind === 'figure')

	return { chapter }
}
