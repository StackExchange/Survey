// Everything about this site that isn't editorial copy or survey data.
//
// At the package root rather than under src/ because both halves read it: the
// app through `$config`, and the build scripts through a relative import. Copy
// that changes per year lives in the content sheet; numbers live in src/data.

// Absolute: during prerendering `page.url.origin` is `http://sveltekit-prerender`.
export const siteUrl = 'https://survey.stackoverflow.co'

export const siteName = 'Stack Overflow Developer Survey'

// Fallbacks only. Year-specific copy comes from $content/survey.json.
export const siteDescription = 'Results of the annual Stack Overflow Developer Survey — how developers learn, build, and work.'

// The index page's own copy, which is about the survey rather than about a year.
export const siteDescriptionLong =
	'Every year we ask developers about the tools they use, how they learn, and how they work. Explore the results of the largest survey of people who code.'

export const ogImage = '/stack-overflow-dev-survey-open-graph.png'

export const githubRepo = 'https://github.com/StackExchange/Survey'

// The instrument as respondents met it. `#q-<id>` scrolls to one question.
export const surveyPreview = 'https://stackoverflow-survey-preview.netlify.app'

// Tailwind token fragments composed at call sites — `bg-${primary}`. Anything
// new here needs adding to the `@source inline` safelist in routes/layout.css.
const chapterColours = [
	{ primary: 'blue', secondary: 'beige' }, // Developers
	{ primary: 'pink', secondary: 'purple' }, // Technology
	{ primary: 'yellow', secondary: 'beige' }, // AI
	{ primary: 'green', secondary: 'blue' }, // Work
	{ primary: 'purple', secondary: 'orange-medium' }, // Community
]

export const chapterColour = (index: number) => chapterColours[(index - 1) % chapterColours.length]

export const promo = {
	visible: false,
	url: 'https://take.survey.stackoverflow.co/jfe/form/SV_4GHunpL3IfJ3rRc?utm_medium=referral&utm_source=survey-results&utm_campaign=dev-survey-2026&utm_content=announcement-banner-survey',
	text: 'The 2026 Stack Overflow Developer Survey is live — take it now →',
	dismissedKey: 'ds-promo-dismissed',
}

export const licence = {
	database: { name: 'ODbL 1.0', url: 'https://opendatacommons.org/licenses/odbl/1-0/' },
	contents: { name: 'DbCL 1.0', url: 'https://opendatacommons.org/licenses/dbcl/1-0/' },
	contributions: { name: 'CC BY-SA', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
	code: { name: 'Apache-2.0', url: `${githubRepo}/blob/main/LICENSE.md` },
	holder: 'Stack Exchange Inc.',
}

// The publisher, as schema.org describes it. `sameAs` is how a consumer knows
// this Organization is the same one it has seen elsewhere.
export const organisation = {
	name: 'Stack Overflow',
	url: 'https://stackoverflow.com/',
	logo: '/apple-touch-icon.png',
	sameAs: [
		'https://en.wikipedia.org/wiki/Stack_Overflow',
		'https://www.linkedin.com/company/stack-overflow/',
		'https://github.com/StackExchange',
		'https://twitter.com/stackoverflow',
	],
}

// The rest of what the JSON-LD asserts about the survey as a dataset.
export const dataset = {
	language: 'en',
	measurementTechnique: 'Self-administered online questionnaire',
	keywords: [
		'software development',
		'developer survey',
		'programming languages',
		'artificial intelligence',
		'developer compensation',
		'remote work',
	],
}

// The content sheet, read by scripts/gsheet.js. Tabs are fetched by name, so a
// renamed tab is a failed fetch rather than a silently empty section.
export const sheet = {
	idEnvVar: 'GOOGLE_SHEETS_SHEETID',
	tabs: ['Settings', 'Chapters', 'Sections', 'Questions', 'Features'],
	// Cells holding several values, pipe-separated.
	listColumns: ['dataset', 'values'],
	csvUrl: (id: string, tab: string) => `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`,
}
