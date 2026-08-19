import path from 'node:path'

import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import svelte from 'eslint-plugin-svelte'
import { defineConfig, includeIgnoreFile } from 'eslint/config'
import globals from 'globals'
import ts from 'typescript-eslint'

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')

export default defineConfig([
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
	},

	{
		// Without this the svelte parser reads <script lang="ts"> blocks as JS.
		files: ['**/*.svelte', '**/*.svelte.js', '**/*.svelte.ts'],
		languageOptions: { parserOptions: { parser: ts.parser } },
	},

	{
		// Override or add rule settings here
		// https://sveltejs.github.io/eslint-plugin-svelte/rules/
		// rules: {
		//   'svelte/no-at-html-tags': 'off',
		// },
	},
])
