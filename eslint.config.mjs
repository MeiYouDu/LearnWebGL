import eslint from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import eslintPluginVue from "eslint-plugin-vue";
import json from "eslint-plugin-jsonc";
import globals from "globals";
// mdx plugin 支持 lint md 文件的
// const mdx from"eslint-plugin-mdx";
import prettier from "eslint-plugin-prettier/recommended";

export default typescriptEslint.config(
	...json.configs["flat/recommended-with-json"],
	{ ignores: ["*.d.ts", "**/coverage", "**/dist"] },
	{
		extends: [
			eslint.configs.recommended,
			...typescriptEslint.configs.recommended,
			...eslintPluginVue.configs["flat/recommended"],
		],
		files: ["**/*.{ts,tsx,jsx,js,vue}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: globals.browser,
			parserOptions: {
				parser: typescriptEslint.parser,
			},
		},
		rules: {
			"no-unused-vars": "warn",
			"no-undef": "warn",
			"vue/multi-word-component-names": "warn",
			"@typescript-eslint/no-empty-function": "warn",
			"@typescript-eslint/no-var-requires": "warn",
			"@typescript-eslint/no-unused-vars": "warn",
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unused-expressions": "warn",
			"@typescript-eslint/no-require-imports": "warn",
		},
		ignores: [
			"node_modules",
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
			"eslint.config.mjs",
		],
	},
	prettier,
);
