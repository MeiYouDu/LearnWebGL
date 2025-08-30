module.exports = {
	"*.{js,ts,jsx,tsx,vue,json,mdx,md}": [
		"pnpm exec eslint --fix",
	],
	"*.{css,sass,scss}": ["pnpm exec stylelint --fix"],
	// 整个工程
	"**/*.{js,ts,jsx,tsx,vue,json,md}": [
		"npx eslint -c eslint.config.mjs --fix ./",
	],
};
