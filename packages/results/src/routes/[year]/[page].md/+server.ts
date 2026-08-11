// One route for every single segment under [year]: the chapters and the
// methodology. Two route ids differing only in param name would collide.
import { entriesFor, markdown } from '$lib/server/md'
import type { EntryGenerator, RequestHandler } from './$types'

// A standalone endpoint does not inherit prerender from the layout.
export const prerender = true

export const entries: EntryGenerator = entriesFor('chapter', 'methodology')

export const GET: RequestHandler = ({ params }) => markdown(['chapter', 'methodology'], params)
