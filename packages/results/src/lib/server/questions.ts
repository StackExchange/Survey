// The question bank in /questions, keyed by question id. Mirrors
// packages/survey/src/lib/data/load.ts, copied rather than imported because that
// module's `$lib/types` would resolve to this package's $lib.
import YAML from 'yaml'

const raws = import.meta.glob<string>('$questions/*/*.yaml', { eager: true, query: '?raw', import: 'default' })

const bank: Record<string, any> = {}

for (const [path, raw] of Object.entries(raws)) {
	try {
		const doc = YAML.parse(raw)
		// The glob key is a resolved path; the repo-relative tail is what a page
		// needs to link the file a question was defined in.
		if (doc?.question?.id) bank[doc.question.id] = { ...doc.question, source: path.replace(/^.*\/questions\//, 'questions/') }
	} catch (error) {
		console.error(`questions: failed to parse ${path}`, error)
	}
}

export const getQuestionDefinition = (qname?: string) => (qname ? (bank[qname] ?? null) : null)
