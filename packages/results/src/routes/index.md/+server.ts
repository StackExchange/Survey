import { markdown } from '$lib/server/md'
import type { RequestHandler } from './$types'

export const prerender = true

export const GET: RequestHandler = () => markdown(['home'], {})
