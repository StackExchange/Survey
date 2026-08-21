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

// Root url for question previews
export const surveyPreview = 'https://stackoverflow-survey-preview.netlify.app'

// Index of the value maps to the survey.json chapter order
const chapterColours = [
	{ bg: 'bg-blue', bgLg: 'lg:bg-blue', border: 'border-blue', primary: 'var(--color-blue)', secondary: 'var(--color-beige)' },
	{ bg: 'bg-pink', bgLg: 'lg:bg-pink', border: 'border-pink', primary: 'var(--color-pink)', secondary: 'var(--color-purple)' },
	{ bg: 'bg-yellow', bgLg: 'lg:bg-yellow', border: 'border-yellow', primary: 'var(--color-yellow)', secondary: 'var(--color-beige)' },
	{ bg: 'bg-green', bgLg: 'lg:bg-green', border: 'border-green', primary: 'var(--color-green)', secondary: 'var(--color-blue)' },
	{
		bg: 'bg-purple',
		bgLg: 'lg:bg-purple',
		border: 'border-purple',
		primary: 'var(--color-purple)',
		secondary: 'var(--color-orange-medium)',
	},
]

export const chapterColour = (index: number) => chapterColours[(index - 1) % chapterColours.length]

// Citation
export const licence = {
	database: { name: 'ODbL 1.0', full: 'Open Database License (ODbL) 1.0', url: 'https://opendatacommons.org/licenses/odbl/1-0/' },
	contents: { name: 'DbCL 1.0', url: 'https://opendatacommons.org/licenses/dbcl/1-0/' },
	contributions: { name: 'CC BY-SA', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
	code: { name: 'Apache-2.0', url: `${githubRepo}/blob/main/LICENSE.md` },
	holder: 'Stack Exchange Inc.',
}

export const citation = (title: string, year: string | number, url: string) =>
	`${licence.holder} (${year}). “${title}”. ${siteName} ${year}. Licensed under ${licence.database.name}. ${url}`

export const citeAs = `Cite as: ${siteName}, ${licence.holder}`

// schema.org for JSON-LD

export const organisation = {
	name: 'Stack Overflow',
	legalName: 'Stack Exchange Inc.',
	url: 'https://stackoverflow.com/',
	logo: '/apple-touch-icon.png',
	sameAs: [
		'https://stackexchange.com',
		'https://www.linkedin.com/company/stack-overflow',
		'https://github.com/StackExchange',
		'https://twitter.com/stackoverflow',
		'https://www.instagram.com/thestackoverflow',
		'https://www.youtube.com/c/StackOverflowOfficial',
		'https://www.threads.net/@thestackoverflow',
	],
}

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
