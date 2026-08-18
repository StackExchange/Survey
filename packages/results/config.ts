// Everything about this site that isn't editorial copy or survey data.

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

export const licence = {
	database: { name: 'ODbL 1.0', url: 'https://opendatacommons.org/licenses/odbl/1-0/' },
	contents: { name: 'DbCL 1.0', url: 'https://opendatacommons.org/licenses/dbcl/1-0/' },
	contributions: { name: 'CC BY-SA', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
	code: { name: 'Apache-2.0', url: `${githubRepo}/blob/main/LICENSE.md` },
	holder: 'Stack Exchange Inc.',
}

// ODbL asks for attribution, and both the "Use this data" panel and the markdown
// twins have to ask for the same wording. No accessed-date: every page is
// prerendered, so a baked one would be the build's rather than the reader's.
export const citation = (title: string, year: string | number, url: string) =>
	`${licence.holder} (${year}). “${title}”. ${siteName} ${year}. Licensed under ${licence.database.name}. ${url}`

// The short form, for a page rather than a figure.
export const citeAs = `Cite as: ${siteName}, ${licence.holder}`

// The publisher, as schema.org describes it. `sameAs` is how a consumer knows
// this Organization is the same one it has seen elsewhere.
export const organisation = {
	name: 'Stack Overflow',
	legalName: 'Stack Exchange Inc.',
	url: 'https://stackoverflow.com/',
	logo: '/apple-touch-icon.png',
	sameAs: [
		'https://stackexchange.com/',
		'https://www.linkedin.com/company/stack-overflow/',
		'https://github.com/StackExchange',
		'https://twitter.com/stackoverflow',
		'https://www.instagram.com/thestackoverflow/',
		'https://www.youtube.com/c/StackOverflowOfficial',
		'https://www.threads.net/@thestackoverflow',
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
