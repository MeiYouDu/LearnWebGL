module.exports = {
	"*.{js,ts,jsx,tsx,vue,json,mdx,md}": [
		"pnpm exec eslint --fix",
	],
	"*.{css,sass,scss}": ["pnpm exec stylelint --fix"],
};
