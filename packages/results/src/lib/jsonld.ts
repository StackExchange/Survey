// The schema.org `@graph` for every page.
//
// Built once by scripts/data.js and carried on each payload, so a route hands it
// straight to <Seo>. It lives here rather than in the script because it is a
// front-end concern — what the page asserts about itself — and the script only
// happens to be where it is cheapest to run.

import { dataset, licence, organisation, siteDescription, siteDescriptionLong, siteName, siteUrl } from '../../config.ts'

const licenceUrl = licence.database.url

const ids = {
	organization: `${siteUrl}/#organization`,
	website: `${siteUrl}/#website`,
	catalog: `${siteUrl}/#catalog`,
	dataset: (p: string) => `${siteUrl}${p}#dataset`,
	page: (p: string) => `${siteUrl}${p}#webpage`,
}

const organization = () => ({
	'@type': 'Organization',
	'@id': ids.organization,
	name: organisation.name,
	legalName: licence.holder,
	url: organisation.url,
	logo: `${siteUrl}${organisation.logo}`,
	sameAs: organisation.sameAs,
})

// No SearchAction: there is no site search, and claiming one is a Search Console
// warning waiting to happen.
const website = () => ({
	'@type': 'WebSite',
	'@id': ids.website,
	url: `${siteUrl}/`,
	name: siteName,
	description: siteDescription,
	publisher: { '@id': ids.organization },
	inLanguage: dataset.language,
})

const breadcrumbs = (trail: { name: string; path: string }[]) => ({
	'@type': 'BreadcrumbList',
	'@id': `${siteUrl}${trail[trail.length - 1].path}#breadcrumbs`,
	itemListElement: trail.map((item, i: number) => ({
		'@type': 'ListItem',
		position: i + 1,
		name: item.name,
		item: `${siteUrl}${item.path}`,
	})),
})

const webPage = (page: any, mainEntity?: string) => ({
	'@type': 'WebPage',
	'@id': ids.page(page.path),
	url: `${siteUrl}${page.path}`,
	name: page.title,
	description: page.description,
	isPartOf: { '@id': ids.website },
	inLanguage: dataset.language,
	...(mainEntity ? { mainEntity: { '@id': mainEntity } } : {}),
	...(page.markdown
		? { encoding: { '@type': 'MediaObject', encodingFormat: 'text/markdown', contentUrl: `${siteUrl}${page.markdown}` } }
		: {}),
})

// Response-data URLs point at GitHub, so this takes either an absolute URL or a
// path on this site.
const download = (format: string, name: string, url: string) => ({
	'@type': 'DataDownload',
	encodingFormat: format,
	name,
	contentUrl: url.startsWith('/') ? `${siteUrl}${url}` : url,
})

export function graphsFor({ survey, years, chapters, chapterPayloads }: any) {
	const year = String(survey.settings.year)
	const base = () => [organization(), website()]
	const crumb = { name: 'Developer Survey', path: '/' }

	const home = [
		...base(),
		webPage({ path: '/', title: 'Stack Overflow Developer Survey', description: siteDescriptionLong, markdown: '/index.md' }, ids.catalog),
		breadcrumbs([crumb]),
		{
			'@type': 'DataCatalog',
			'@id': ids.catalog,
			name: `${siteName} results`,
			url: `${siteUrl}/`,
			publisher: { '@id': ids.organization },
			license: licenceUrl,
			dataset: years
				.filter(({ results }: any) => results)
				.map(({ year: y, results, data }: any) => ({
					'@type': 'Dataset',
					'@id': ids.dataset(results.startsWith('/') ? results : `/${y}`),
					name: `${siteName} ${y}`,
					url: `${siteUrl}${results.startsWith('/') ? results : `/${y}`}`,
					...(data ? { distribution: [download('text/csv', `${y} response data (CSV)`, data)] } : {}),
				})),
		},
	]

	const yearGraph = [
		...base(),
		webPage(
			{
				path: `/${year}`,
				title: `Stack Overflow Developer Survey ${year}`,
				description: survey.settings.description,
				markdown: `/${year}.md`,
			},
			ids.dataset(`/${year}`)
		),
		breadcrumbs([crumb, { name: year, path: `/${year}` }]),
		{
			'@type': 'Dataset',
			'@id': ids.dataset(`/${year}`),
			name: `${siteName} ${year}`,
			alternateName: `${year} Developer Survey`,
			description: survey.settings.descriptionLong || survey.settings.description,
			url: `${siteUrl}/${year}`,
			identifier: `${siteUrl}/${year}`,
			creator: { '@id': ids.organization },
			publisher: { '@id': ids.organization },
			includedInDataCatalog: { '@id': ids.catalog },
			license: licenceUrl,
			isAccessibleForFree: true,
			inLanguage: dataset.language,
			// A bare year is the honest value: the content sheet carries no field
			// dates. Add fieldStart/fieldEnd upstream and this becomes an interval.
			temporalCoverage: year,
			measurementTechnique: dataset.measurementTechnique,
			creditText: `${siteName} ${year}`,
			keywords: dataset.keywords,
			hasPart: chapters.map(({ id }: any) => ({ '@id': ids.dataset(`/${year}/${id}/data`) })),
			distribution: [download('text/markdown', `${year} results as markdown`, `/${year}.md`)],
		},
	]

	const methodologyPath = `/${year}/methodology`
	const methodology = [
		...base(),
		webPage({
			path: methodologyPath,
			title: `Methodology ${year}`,
			description: 'How the survey was run and how the numbers were worked out.',
			markdown: `${methodologyPath}.md`,
		}),
		breadcrumbs([crumb, { name: year, path: `/${year}` }, { name: 'Methodology', path: methodologyPath }]),
	]

	const chapter: Record<string, any> = {}
	const dataPage: Record<string, any> = {}
	const question: Record<string, any> = {}

	for (const c of chapters) {
		const chapterPath = `/${year}/${c.id}`
		const dataPath = `${chapterPath}/data`
		const figures = (chapterPayloads[c.id]?.sections ?? []).flatMap((s: any) => s.questions)

		chapter[c.id] = [
			...base(),
			webPage({ path: chapterPath, title: `${c.name} ${year}`, description: c.description, markdown: `${chapterPath}.md` }),
			breadcrumbs([crumb, { name: year, path: `/${year}` }, { name: c.name, path: chapterPath }]),
			{
				'@type': 'Article',
				'@id': `${chapterPath === '' ? '' : `${siteUrl}${chapterPath}`}#article`,
				headline: c.name,
				description: c.description,
				articleSection: c.name,
				url: `${siteUrl}${chapterPath}`,
				isPartOf: { '@id': ids.website },
				author: { '@id': ids.organization },
				publisher: { '@id': ids.organization },
				about: { '@id': ids.dataset(dataPath) },
				inLanguage: dataset.language,
				// No datePublished: the content sheet has no date, and a fabricated
				// one is worse than none.
			},
		]

		const chapterDataset = {
			'@type': 'Dataset',
			'@id': ids.dataset(dataPath),
			name: `${c.name} — ${siteName} ${year}`,
			description: c.description || `Every figure in the ${c.name} chapter.`,
			url: `${siteUrl}${dataPath}`,
			isPartOf: { '@id': ids.dataset(`/${year}`) },
			creator: { '@id': ids.organization },
			license: licenceUrl,
			isAccessibleForFree: true,
			temporalCoverage: year,
			// `propertyID` is the CSV column name.
			variableMeasured: figures.map((q: any) => ({
				'@type': 'PropertyValue',
				propertyID: q.dataId,
				name: q.name ?? q.dataId,
				description: q.definition?.title ?? q.question,
				url: `${siteUrl}${dataPath}/${q.id}`,
			})),
			distribution: [download('text/markdown', `${c.name} data as markdown`, `${dataPath}.md`)],
		}

		dataPage[c.id] = [
			...base(),
			webPage(
				{
					path: dataPath,
					title: `${c.name} data ${year}`,
					description: `Every figure in the ${c.name} chapter, with sample sizes.`,
					markdown: `${dataPath}.md`,
				},
				ids.dataset(dataPath)
			),
			breadcrumbs([crumb, { name: year, path: `/${year}` }, { name: c.name, path: chapterPath }, { name: 'Data', path: dataPath }]),
			chapterDataset,
		]

		for (const q of figures) {
			const path = `${dataPath}/${q.id}`
			const group = q.demographics[0]
			const n = group.demographic.n

			question[`${c.id}/${q.id}`] = [
				...base(),
				webPage({ path, title: `${q.name} ${year}`, description: q.description, markdown: `${path}.md` }, ids.dataset(path)),
				breadcrumbs([
					crumb,
					{ name: year, path: `/${year}` },
					{ name: c.name, path: chapterPath },
					{ name: 'Data', path: dataPath },
					{ name: q.name, path },
				]),
				{
					'@type': 'Dataset',
					'@id': ids.dataset(path),
					name: `${q.name} — ${siteName} ${year}`,
					description: q.definition?.title ?? q.question,
					url: `${siteUrl}${path}`,
					isPartOf: { '@id': ids.dataset(dataPath) },
					creator: { '@id': ids.organization },
					license: licenceUrl,
					isAccessibleForFree: true,
					temporalCoverage: year,
					// Rows with no response or no numeric percent are skipped: a table
					// row carries rank/median/mode instead.
					variableMeasured: group.data
						.filter((row: any) => row.response != null && typeof row.pct === 'number')
						.map((row: any) => ({
							'@type': 'PropertyValue',
							propertyID: q.dataId,
							name: row.response,
							value: Number((row.pct * 100).toFixed(2)),
							unitText: 'PERCENT',
							description: `${row.count?.toLocaleString('en-US')} of ${n?.toLocaleString('en-US')} respondents (${group.demographic.name})`,
						})),
					distribution: [download('text/markdown', 'Every respondent group as markdown', `${path}.md`)],
				},
			]
		}
	}

	return { home, year: yearGraph, methodology, chapter, dataPage, question }
}
