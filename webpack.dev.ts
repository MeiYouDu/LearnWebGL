import { merge } from "webpack-merge";
import type { Configuration as ServerConfiguration } from "webpack-dev-server";
import common from "./webpack.common.ts";
import { Configuration, DefinePlugin } from "webpack";
import { EXCLUDECSS } from "./constant.ts";

interface Config extends Configuration {
	devServer?: ServerConfiguration;
}

interface ErrorEXT extends Error {
	moduleName?: string;
}

export default merge<Config>(common, {
	mode: "development",
	devtool: "source-map",
	devServer: {
		port: 1888,
		compress: true,
		hot: true,
		historyApiFallback: true,
		client: {
			overlay: {
				warnings: (warn: ErrorEXT) => {
					/*
						过滤掉这个库的warning，这个库源码里面使用了Critical dependency，
						也就是require("这里的路径是一个变量")，导致了这个警告，但实际上代码可以正常运行，所以通过这个方式过滤掉
					*/
					const EXP = /typescript/;
					return !(
						warn.moduleName && EXP.test(warn.moduleName)
					);
				},
			},
		},
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				exclude: EXCLUDECSS,
				use: [
					// 开发环境使用style-loader让样式也享受HMR
					"style-loader",
					{
						loader: "css-loader",
						options: {
							sourceMap: true,
							importLoaders: 1,
							modules: {
								auto: true,
								localIdentName: "[local]_[hash:base64:8]",
								exportGlobals: true,
								namedExport: true,
							},
						},
					},
					{
						loader: "postcss-loader",
					},
				],
			},
			{
				test: /\.s[ac]ss$/i,
				exclude: EXCLUDECSS,
				use: [
					"style-loader",
					{
						loader: "css-loader",
						options: {
							sourceMap: true,
							importLoaders: 2,
							modules: {
								auto: true,
								localIdentName: "[local]_[hash:base64:8]",
								exportGlobals: true,
								namedExport: true,
							},
						},
					},
					{
						loader: "postcss-loader",
					},
					{
						loader: "sass-loader",
						options: {
							sourceMap: true,
						},
					},
				],
			},
		],
	},
	plugins: [
		new DefinePlugin({
			"process.env.NODE_ENV": JSON.stringify("development"),
		}),
	],
});
