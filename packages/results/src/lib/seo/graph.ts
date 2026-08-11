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

export const yearDataset = (year: string, settings: any, chapterIds: string[]) => ({
	'@type': 'Dataset',
	'@id': ids.dataset(`/${year}`),
	name: `${siteName} ${year}`,
	alternateName: `${year} Developer Survey`,
	description: settings.descriptionLong || settings.description,
	url: `${siteUrl}/${year}`,
	identifier: `${siteUrl}/${year}`,
	creator: { '@id': ids.organization },
	publisher: { '@id': ids.organization },
	includedInDataCatalog: { '@id': ids.catalog },
	license: licenceUrl,
	isAccessibleForFree: true,
	inLanguage: 'en',
	// A bare year is the honest value: the content sheet carries no field dates.
	// Add fieldStart/fieldEnd upstream and this becomes a proper interval.
	temporalCoverage: year,
	measurementTechnique: 'Self-administered online questionnaire',
	creditText: `${siteName} ${year}`,
	keywords: [
		'software development',
		'developer survey',
		'programming languages',
		'artificial intelligence',
		'developer compensation',
		'remote work',
	],
	hasPart: chapterIds.map((id) => ({ '@id': ids.dataset(`/${year}/${id}/data`) })),
	distribution: [download('text/markdown', `${year} results as markdown`, `/${year}.md`)],
})

export const article = (year: string, chapter: any) => ({
	'@type': 'Article',
	'@id': `${siteUrl}/${year}/${chapter.id}#article`,
	headline: chapter.name,
	description: chapter.description,
	articleSection: chapter.name,
	url: `${siteUrl}/${year}/${chapter.id}`,
	isPartOf: { '@id': ids.website },
	author: { '@id': ids.organization },
	publisher: { '@id': ids.organization },
	about: { '@id': ids.dataset(`/${year}/${chapter.id}/data`) },
	inLanguage: 'en',
	// No datePublished: the content sheet has no date, and a fabricated one is
	// worse than none.
})

/** A chapter's data page. `propertyID` is the CSV column name. */
export const chapterDataset = (year: string, chapter: any, questions: any[], csv?: string | null) => ({
	'@type': 'Dataset',
	'@id': ids.dataset(`/${year}/${chapter.id}/data`),
	name: `${chapter.name} — ${siteName} ${year}`,
	description: chapter.description || `Every figure in the ${chapter.name} chapter.`,
	url: `${siteUrl}/${year}/${chapter.id}/data`,
	isPartOf: { '@id': ids.dataset(`/${year}`) },
	creator: { '@id': ids.organization },
	license: licenceUrl,
	isAccessibleForFree: true,
	temporalCoverage: year,
	variableMeasured: questions.map((q: any) => ({
		'@type': 'PropertyValue',
		propertyID: q.dataId,
		name: q.name ?? q.dataId,
		description: q.definition?.title ?? q.question,
		url: `${siteUrl}/${year}/${chapter.id}/data/${q.id}`,
	})),
	distribution: [
		download('text/markdown', `${chapter.name} data as markdown`, `/${year}/${chapter.id}/data.md`),
		...(csv ? [download('text/csv', 'Response data (CSV)', csv)] : []),
	],
})

/** One question. Rows without a response or a numeric percent are skipped —
 *  sankey rows have no response, stacked rows carry arrays, table rows carry
 *  rank/median/mode. */
export const questionDataset = (year: string, chapterId: string, question: any, csv?: string | null) => {
	const path = `/${year}/${chapterId}/data/${question.id}`
	const n = question.demographic?.n

	return {
		'@type': 'Dataset',
		'@id': ids.dataset(path),
		name: `${question.name} — ${siteName} ${year}`,
		description: question.definition?.title ?? question.question,
		url: `${siteUrl}${path}`,
		isPartOf: { '@id': ids.dataset(`/${year}/${chapterId}/data`) },
		creator: { '@id': ids.organization },
		license: licenceUrl,
		isAccessibleForFree: true,
		temporalCoverage: year,
		variableMeasured: (question.data ?? [])
			.filter((row: any) => row?.response != null && typeof row.percent === 'number')
			.map((row: any) => ({
				'@type': 'PropertyValue',
				propertyID: question.dataId,
				name: row.response,
				value: Number((row.percent * 100).toFixed(2)),
				unitText: 'PERCENT',
				description: `${row.frequency?.toLocaleString('en-US')} of ${n?.toLocaleString('en-US')} respondents (${question.demographic?.name})`,
			})),
		distribution: [
			download('text/markdown', 'Every respondent group as markdown', `${path}.md`),
			...(csv ? [download('text/csv', 'Response data (CSV)', csv)] : []),
		],
	}
}
