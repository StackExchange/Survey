// Non-editorial, slower moving global settings

// Absolute: during prerendering `page.url.origin` is `http://sveltekit-prerender`.
export const siteUrl = 'https://survey.stackoverflow.co'

export const siteName = 'Stack Overflow Developer Survey'

// Fallbacks only. Year-specific copy comes from $content/survey.json.
export const siteDescription = 'Results of the annual Stack Overflow Developer Survey — how developers learn, build, and work.'

export const ogImage = '/stack-overflow-dev-survey-open-graph.png'

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

export const githubRepo = 'https://github.com/StackExchange/Survey'

// The instrument as respondents met it. `#q-<id>` scrolls to one question.
export const surveyPreview = 'https://stackoverflow-survey-preview.netlify.app'

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
