module.exports = {
	sourceType: "unambiguous",
	presets: [
		[
			"@babel/preset-env",
			{
				useBuiltIns: "usage",
				corejs: 3,
			},
		],
		[
			"@babel/preset-typescript",
			{
				isTSX: true,
				allowNamespaces: true,
				allExtensions: true,
				optimizeConstEnums: true,
			},
		],
	],
	plugins: [
		[
			"@vue/babel-plugin-jsx",
			{
				transformOn: true,
			},
		],
		[
			"@babel/plugin-proposal-decorators",
			{ version: "legacy" },
		],
	],
};
