module.exports = {
	sourceType: "unambiguous",
	presets: [
		[
			"@babel/preset-env",
			{
				useBuiltIns: "usage",
				corejs: "3.45",
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
		[
			"@babel/preset-react",
			{
				runtime: "automatic",
			},
		],
	],
	plugins: [
		[
			"@babel/plugin-proposal-decorators",
			{ version: "legacy" },
		],
		"babel-plugin-react-compiler",
	],
};
