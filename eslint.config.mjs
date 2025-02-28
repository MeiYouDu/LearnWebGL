import js from "@eslint/js";
import tsEslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import json from "eslint-plugin-jsonc";
// mdx plugin 支持 lint md 文件的
// const mdx from"eslint-plugin-mdx";
import prettier from "eslint-plugin-prettier/recommended";

export default [
	...json.configs["flat/recommended-with-json"],
	js.configs.recommended,
	// eslintPluginImport.configs.recommended,
	...tsEslint.configs.recommended,
	...vue.configs["flat/recommended"],
	// mdx.flat,
	// mdx.flatCodeBlocks,
	// markdown.configs.recommended,
	prettier,
	{
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
];
