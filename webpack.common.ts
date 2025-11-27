import { env } from "node:process";
import { resolve } from "node:path";
import EslintWebpackPlugin from "eslint-webpack-plugin";
import StylelintWebpackPlugin from "stylelint-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import NodePolyfillWebpackPlugin from "node-polyfill-webpack-plugin";
import { Configuration, DefinePlugin } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import {
	CONTEXT,
	EXAMPLE_ENTRY,
	EXAMPLE_OUTPUT_PATH,
	EXCLUDE,
	HTML_TEMPLATE,
} from "./constant.ts";

const config: Configuration = {
	context: CONTEXT,
	entry: { index: EXAMPLE_ENTRY },
	output: {
		clean: true,
		path: EXAMPLE_OUTPUT_PATH,
		publicPath: "/",
		filename: "js/[name].[contenthash:8].bundle.js",
		chunkFilename:
			"js/[name].[contenthash:8].bundle.js",
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			"@test": resolve(__dirname, "./test"),
		},
		fullySpecified: false,
		extensions: [
			".js",
			".cjs",
			".mjs",
			".ts",
			".tsx",
			".scss",
			".css",
			".jsx",
			".html",
		],
	},
	module: {
		rules: [
			{
				test: /\.m?js$/i,
				exclude: EXCLUDE,
				use: [
					// {
					// 	loader: "thread-loader",
					// 	options: THREAD_LOADER_OPTIONS,
					// },
					{
						loader: "babel-loader",
					},
				],
			},
			{
				test: /\.ts$/,
				exclude: EXCLUDE,
				use: [
					// {
					// 	loader: "thread-loader",
					// 	options: THREAD_LOADER_OPTIONS,
					// },
					{
						loader: "babel-loader",
					},
				],
			},
			{
				test: /\.[jt]sx$/,
				exclude: EXCLUDE,
				use: [
					// {
					// 	loader: "thread-loader",
					// 	options: THREAD_LOADER_OPTIONS,
					// },
					{
						loader: "babel-loader",
					},
				],
			},
			{
				test: /\.(png|svg|jpe?g|gif)$/i,
				type: "asset",
				exclude: EXCLUDE,
				generator: {
					filename:
						"assets/images/[name].[contenthash:8][ext]",
				},
				parser: {
					dataUrlCondition: {
						maxSize: 128 * 1024,
					},
				},
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				type: "asset/resource",
				generator: {
					filename:
						"assets/fonts/[name].[contenthash:8][ext]",
				},
			},
			{
				test: /\.(tle|txt)$/i,
				type: "asset/resource",
				exclude: EXCLUDE,
				generator: {
					filename:
						"assets/text/[name].[contenthash:8][ext]",
				},
			},
			{
				test: /\.(glsl|vert|frag)$/i,
				loader: "webpack-glsl-loader",
				exclude: EXCLUDE,
			},
			{
				test: /\.md$/,
				exclude: EXCLUDE,
				use: [
					{
						loader: "html-loader",
					},
					{
						loader: "markdown-loader",
						options: {},
					},
				],
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			title: "ReactTemplate",
			filename: "index.html",
			chunks: ["index"],
			template: HTML_TEMPLATE,
		}),
		new ForkTsCheckerWebpackPlugin(),
		new NodePolyfillWebpackPlugin(),
		new EslintWebpackPlugin({
			failOnError: env.NODE_ENV === "production",
			lintDirtyModulesOnly:
				env.NODE_ENV === "development",
			configType: "flat",
			context: resolve(__dirname, "./"),
			fixTypes: ["problem", "suggestion", "layout"],
			extensions: [
				".js",
				".ts",
				".json",
				".jsx",
				".tsx",
				".mdx",
				".md",
			],
			emitWarning: false,
			concurrency: "auto",
		}),
		new StylelintWebpackPlugin({
			cache: true,
			threads: true,
			allowEmptyInput: true,
			context: resolve(__dirname, "./"),
			lintDirtyModulesOnly:
				env.NODE_ENV === "development",
		}),
		// new CopyWebpackPlugin({
		// 	patterns: [
		// 		{
		// 			from: resolve(
		// 				__dirname,
		// 				"src/assets/model",
		// 			),
		// 			to: "assets/model",
		// 		},
		// {
		// 	from: resolve(
		// 		__dirname,
		// 		"./node_modules/cesium/Source/ThirdParty",
		// 	),
		// 	to: "cesiumAssets/ThirdParty",
		// },
		// {
		// 	from: resolve(
		// 		__dirname,
		// 		"./node_modules/cesium/Source/Assets",
		// 	),
		// 	to: "cesiumAssets/Assets",
		// },
		// {
		// 	from: resolve(
		// 		__dirname,
		// 		"./node_modules/cesium/Source/Widgets",
		// 	),
		// 	to: "cesiumAssets/Widgets",
		// },
		// {
		// 	from: resolve(
		// 		__dirname,
		// 		"./node_modules/cesium/Source/Cesium.d.ts",
		// 	),
		// 	to: "assets/declare",
		// },
		// ...PATTERNS,
		// 	],
		// }),
		new DefinePlugin({
			CESIUM_BASE_URL:
				JSON.stringify("/cesiumAssets"),
		}),
	],
	optimization: {
		runtimeChunk: true,
		providedExports: true,
		sideEffects: true,
		splitChunks: {
			chunks: "all",
			minSize: 20000,
			minRemainingSize: 0,
			minChunks: 1,
			maxSize: 244 * 1024,
			maxAsyncRequests: 30,
			maxInitialRequests: 30,
			enforceSizeThreshold: 50000,
			usedExports: true,
			cacheGroups: {
				defaultVendors: {
					name: "vendors",
					test: /[\\/]node_modules[\\/]/,
					priority: -10,
					reuseExistingChunk: true,
				},
				default: {
					name: "common",
					minChunks: 2,
					priority: -20,
					reuseExistingChunk: true,
				},
			},
		},
	},
	experiments: {
		cacheUnaffected: true,
	},
	cache: {
		type: "filesystem",
		store: "pack",
		memoryCacheUnaffected: true,
		compression: "gzip",
	},
};

export default config;
