import type { EntryGenerator, RequestHandler } from './$types'

import { markdown, markdownEntries } from '$lib/server/llms'

// A standalone endpoint does not inherit prerender from the layout.
export const prerender = true

export const entries: EntryGenerator = markdownEntries

export const GET: RequestHandler = ({ params }) => markdown(params.page)
