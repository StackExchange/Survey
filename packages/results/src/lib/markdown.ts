// The markdown twin of a page, generated in src/lib/server/llms.ts.
//
// Rendering markdown to HTML happens in scripts/data.js, not here — the payloads
// carry a `*Html` field beside each piece of copy, which keeps `marked` out of
// the client bundle.

export const markdownPath = (pathname: string) => (pathname === '/' ? '/index.md' : `${pathname.replace(/\/$/, '')}.md`)
