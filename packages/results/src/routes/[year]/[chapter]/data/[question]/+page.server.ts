import type { EntryGenerator, PageServerLoad } from './$types'

import { error } from '@sveltejs/kit'

import site from '$generated/site.json'
import { getQuestion } from '$lib/server/content'

export const entries: EntryGenerator = () => site.entries.question

// The generated payload is already `{ question, chapter }`, so this returns it.
export const load: PageServerLoad = ({ params }) => {
	const payload = getQuestion(params.chapter, params.question)

	if (!payload) error(404, `No question "${params.question}"`)

	return payload
}
