// schema.org node builders, each a plain object with no `@context` — pages
// assemble them into one `@graph` and consumers de-duplicate by `@id`.
//
// A question is a `PropertyValue` in `Dataset.variableMeasured`, deliberately not
// `Question`/`suggestedAnswer`: that vocabulary is community Q&A and would assert
// respondents proposed the options. `QAPage` drives Google's Q&A rich result.
import { asset } from '$app/paths'
import { licence, siteDescription, siteName, siteUrl } from '$lib/constants'

const licenceUrl = licence.database.url

export const ids = {
	organization: `${siteUrl}/#organization`,
	website: `${siteUrl}/#website`,
	catalog: `${siteUrl}/#catalog`,
	dataset: (path: string) => `${siteUrl}${path}#dataset`,
	page: (path: string) => `${siteUrl}${path}#webpage`,
}

export const organization = () => ({
	'@type': 'Organization',
	'@id': ids.organization,
	name: 'Stack Overflow',
	legalName: licence.holder,
	url: 'https://stackoverflow.com/',
	logo: `${siteUrl}${asset('/apple-touch-icon.png')}`,
	sameAs: [
		'https://en.wikipedia.org/wiki/Stack_Overflow',
		'https://www.linkedin.com/company/stack-overflow/',
		'https://github.com/StackExchange',
		'https://twitter.com/stackoverflow',
	],
})

// No SearchAction: there is no site search, and claiming one is a Search Console
// warning waiting to happen.
export const website = () => ({
	'@type': 'WebSite',
	'@id': ids.website,
	url: `${siteUrl}/`,
	name: siteName,
	description: siteDescription,
	publisher: { '@id': ids.organization },
	inLanguage: 'en',
})

export const breadcrumbs = (trail: { name: string; path: string }[]) => ({
	'@type': 'BreadcrumbList',
	'@id': `${siteUrl}${trail.at(-1)!.path}#breadcrumbs`,
	itemListElement: trail.map((item, i) => ({
		'@type': 'ListItem',
		position: i + 1,
		name: item.name,
		item: `${siteUrl}${item.path}`,
	})),
})

export const webPage = (page: { path: string; title: string; description: string; markdown?: string }, mainEntity?: string) => ({
	'@type': 'WebPage',
	'@id': ids.page(page.path),
	url: `${siteUrl}${page.path}`,
	name: page.title,
	description: page.description,
	isPartOf: { '@id': ids.website },
	inLanguage: 'en',
	...(mainEntity ? { mainEntity: { '@id': mainEntity } } : {}),
	...(page.markdown
		? { encoding: { '@type': 'MediaObject', encodingFormat: 'text/markdown', contentUrl: `${siteUrl}${page.markdown}` } }
		: {}),
})

// Response-data URLs point at GitHub, so this one takes either an absolute URL or
// a path on this site.
const download = (format: string, name: string, url: string) => ({
	'@type': 'DataDownload',
	encodingFormat: format,
	name,
	contentUrl: url.startsWith('/') ? `${siteUrl}${url}` : url,
})

/** Every published year, as the catalogue the index page actually is. */
export const catalog = (years: any[]) => ({
	'@type': 'DataCatalog',
	'@id': ids.catalog,
	name: `${siteName} results`,
	url: `${siteUrl}/`,
	publisher: { '@id': ids.organization },
	license: licenceUrl,
	dataset: years.map(({ year, results, data }: any) => ({
		'@type': 'Dataset',
		'@id': ids.dataset(results.startsWith('/') ? results : `/${year}`),
		name: `${siteName} ${year}`,
		url: `${siteUrl}${results.startsWith('/') ? results : `/${year}`}`,
		...(data ? { distribution: [download('text/csv', `${year} response data (CSV)`, data)] } : {}),
	})),
})
