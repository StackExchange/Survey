// Normalise the polymorphic option entries (bare string OR object with
// label/key/text_entry) into a uniform shape for rendering and for resolving
// the keys referenced by survey.yaml's if/then blocks.

import { snakeCase } from 'lodash-es'
import type { OptionEntry } from '$lib/types'

export interface NormalisedOption {
	key: string
	label: string
	textEntry: boolean
	// True when the option had an explicit `key:` in the YAML — these are the
	// deliberately-named keys referenced by `if/then` blocks in survey.yaml.
	// The preview surfaces them as a small badge alongside the option.
	explicitKey: boolean
}

export function normaliseOptions(opts: OptionEntry[] | undefined): NormalisedOption[] {
	if (!opts) return []

	return opts.map((opt) => {
		if (typeof opt === 'string') {
			return { key: snakeCase(opt), label: opt, textEntry: false, explicitKey: false }
		}

		return {
			key: opt.key ?? snakeCase(opt.label),
			label: opt.label,
			textEntry: !!opt.text_entry,
			explicitKey: opt.key !== undefined,
		}
	})
}
