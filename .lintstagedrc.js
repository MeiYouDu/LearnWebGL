module.exports = {
	"*.{js,ts,jsx,tsx,json,mdx,md}": [
		"pnpm exec eslint --fix",
	],
	"*.{css,sass,scss}": [
		"pnpm exec stylelint --fix --cache-location node_modules/.cache/stylelint-webpack-plugin/.stylelintcache",
	],
	// 整个工程
	"**/*.{js,ts,jsx,tsx,json,md}": [
		"npx eslint ./ --fix -c eslint.config.mjs --cache-location node_modules/.cache/eslint-webpack-plugin/.eslintcache --concurrency auto",
	],
};
