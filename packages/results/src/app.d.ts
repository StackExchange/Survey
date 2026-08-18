// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface PageState {
			/** Set by `openQuestion` in $lib/panel — the question route's data, for QuestionPanel. */
			question?: import('./routes/[year]/[chapter]/data/[question]/$types').PageData
		}
	}
}

export {}
