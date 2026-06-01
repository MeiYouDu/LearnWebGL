import react from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import jsonc from "eslint-plugin-jsonc";
import prettier from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import ts from "typescript-eslint";

/**
 * ESLint configuration.
 * @see https://eslint.org/docs/latest/use/configure/
 */
export default ts.config(
	// Global ignores
	{
		ignores: [
			".cache",
			".venv",
			"**/.astro/**/*",
			"**/dist",
			"**/node_modules",
			"docs/.vitepress/cache",
			"docs/.vitepress/dist",
			"dist",
			".husky",
			".idea",
			".vscode",
			"logs",
			"*.log",
			"npm-debug.log*",
			"yarn-debug.log*",
			"yarn-error.log*",
			"lerna-debug.log*",
			".pnpm-debug.log*",
			"addons",
			"tsconfig.json",
			"tsconfig-for-webpack-config.json",
			"src/assets/**/*.json",
		],
	},
	{
		settings: {
			react: {
				version: "19.0",
			},
		},
	},
	// Base configs for all files
	js.configs.recommended,
	ts.configs.recommended,
	reactPlugin.configs.flat.recommended,
	reactPlugin.configs.flat["jsx-runtime"],
	reactHooks.configs.flat.recommended,
	...jsonc.configs["flat/recommended-with-json"],
	prettier,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: ts.parser,
		},
	},
	// Node.js environment (servers, scripts, config files)
	{
		files: ["*.{js,cjs,mjs}"],
		languageOptions: {
			globals: { ...globals.node },
		},
	},

	// React/Browser environment (frontend apps)
	{
		files: ["**/*.{jsx,tsx}"],
		...react.configs["recommended-typescript"],
		rules: {
			"@eslint-react/dom/no-missing-iframe-sandbox": "off",
		},
		languageOptions: {
			parser: ts.parser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				jsxImportSource: "react",
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				...globals.browser,
				...globals.es2021,
			},
		},
	},
	{
		rules: {
			"@typescript-eslint/no-require-imports": "warn",
			"@typescript-eslint/no-unused-vars": "warn",
		},
	},
);
