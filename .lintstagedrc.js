module.exports = {
	"*.{js,ts,jsx,tsx,json,mdx,md}": ["pnpm exec eslint --fix"],
	"*.{css,sass,scss}": [
		"pnpm exec stylelint --fix --cache-location node_modules/.cache/stylelint-webpack-plugin/.stylelintcache",
	],
	// 整个工程
	"**/*.{js,ts,jsx,tsx,json,md}": [
		"npx eslint ./ --fix -c eslint.config.mjs --cache-location node_modules/.cache/eslint-webpack-plugin/.eslintcache --concurrency auto",
	],
	// 类型校验：暂存 TS 时对全工程执行 tsc（tsc 无法只检查单个文件，用函数形式避免追加文件名）
	"*.{ts,tsx}": () => "pnpm typecheck",
};
