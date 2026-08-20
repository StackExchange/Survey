import type { EntryGenerator, RequestHandler } from './$types'

import { entriesFor, markdown } from '$lib/server/llms'

export const prerender = true

export const entries: EntryGenerator = entriesFor('question')

export const GET: RequestHandler = ({ params }) => markdown(['question'], params)
