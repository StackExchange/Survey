// The markdown twin of the index page, linked from <head> as rel="alternate". Its
// own route because `/` has no segment for `[page].md` to match; the body is
// `home()` in $lib/server/llms, like every other twin.
import { markdown } from '$lib/server/llms'

export const prerender = true

export const GET = () => markdown(['home'], {})
