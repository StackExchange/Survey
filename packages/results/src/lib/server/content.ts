// Looking up a generated payload by its route params.
//
// The join between the content sheet, the survey export and the question bank
// happens once in `scripts/data.js` and lands in `$generated`. Everything that
// isn't keyed by a param — settings, the chapter list, the prerender entries —
// is a plain field on `$generated/site.json`, so import that directly rather
// than going through here.
//
// Run `npm run data -w results` to rebuild, or just start Vite: the plugin in
// vite.config.js does it on every dev start and build.

// The glob key is an absolute path; the tail after the payload kind is the id.
// `lastIndexOf`, not `indexOf`: the kind is a segment of $generated, and matching
// the first one would key off a directory above the repo that happened to be
// called the same thing.
const load = (glob: Record<string, any>, kind: string) =>
	Object.fromEntries(
		Object.entries(glob).map(([path, payload]) => [path.slice(path.lastIndexOf(kind) + kind.length).replace(/\.json$/, ''), payload])
	)

const chapters = load(import.meta.glob('$generated/chapter/*.json', { eager: true, import: 'default' }), '/chapter/')
const chapterData = load(import.meta.glob('$generated/data/*.json', { eager: true, import: 'default' }), '/data/')
const questions = load(import.meta.glob('$generated/question/*/*.json', { eager: true, import: 'default' }), '/question/')

export const getChapter = (id: string) => chapters[id] ?? null

export const getChapterData = (id: string) => chapterData[id] ?? null

export const getQuestion = (chapterId: string, slug: string) => questions[`${chapterId}/${slug}`] ?? null
