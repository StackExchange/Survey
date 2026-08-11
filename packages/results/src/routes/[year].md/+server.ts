import { entriesFor, markdown } from '$lib/server/md'
import type { EntryGenerator, RequestHandler } from './$types'

// A standalone endpoint does not inherit prerender from the layout.
export const prerender = true

export const entries: EntryGenerator = entriesFor('year')

export const GET: RequestHandler = ({ params }) => markdown(['year'], params)
