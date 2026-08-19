import type { LayoutServerLoad } from './$types'

import { error } from '@sveltejs/kit'

import site from '$generated/site.json'

export const load: LayoutServerLoad = ({ params }) => {
	if (params.year !== site.settings.year) error(404, `No results for ${params.year}`)

	return { year: params.year, chapters: site.chapters }
}
