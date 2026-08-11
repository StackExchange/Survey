import { error } from '@sveltejs/kit'

import { listChapters, settings } from '$lib/server/content'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ params }) => {
	if (params.year !== settings.year) error(404, `No results for ${params.year}`)

	return { year: params.year, chapters: listChapters() }
}
