import { entriesFor, markdown } from '$lib/server/llms'
import type { EntryGenerator, RequestHandler } from './$types'

// A standalone endpoint does not inherit prerender from the layout.
export const prerender = true

export const entries: EntryGenerator = entriesFor('data')

export const GET: RequestHandler = ({ params }) => markdown(['data'], params)
