import { error } from '@sveltejs/kit'

import { getQuestion, listChapters, listQuestions, settings } from '$lib/server/content'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () =>
	listChapters().flatMap(({ id }) => listQuestions(id).map(({ slug }) => ({ year: settings.year, chapter: id, question: slug })))

export const load: PageServerLoad = ({ params }) => {
	const chapter = listChapters().find(({ id }) => id === params.chapter)
	const question = chapter && getQuestion(params.chapter, params.question)

	if (!question || question.kind !== 'figure') error(404, `No question "${params.question}"`)

	return { question, chapter }
}
