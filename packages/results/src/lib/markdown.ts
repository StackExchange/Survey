// The markdown twin of a page, generated in src/routes/index.md.
export const markdownPath = (pathname: string) => (pathname === '/' ? '/index.md' : `${pathname.replace(/\/$/, '')}.md`)
