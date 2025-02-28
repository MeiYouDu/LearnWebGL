import { Configuration, DefinePlugin } from "webpack";
import { merge } from "webpack-merge";
import CompressionPlugin from "compression-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import TerserWebpackPlugin from "terser-webpack-plugin";
import common from "./webpack.common.ts";
import { EXCLUDECSS } from "./constant.ts";

export default merge<Configuration>(common, {
	mode: "production",
	devtool: false,
	plugins: [
		new CompressionPlugin(),
		new MiniCssExtractPlugin({
			filename: "assets/css/[name].[contenthash:8].css",
		}),
		new DefinePlugin({
			"process.env.NODE_ENV": JSON.stringify("production"),
		}),
	],
	module: {
		rules: [
			{
				test: /\.css$/i,
				exclude: EXCLUDECSS,
				use: [
					// 生产环境抽离css
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							importLoaders: 2,
							modules: {
								auto: true,
								localIdentName: "[local]_[hash:base64:8]",
								exportGlobals: true,
							},
						},
					},
					"postcss-loader",
				],
			},
			{
				test: /\.s[ac]ss$/i,
				exclude: EXCLUDECSS,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							importLoaders: 2,
							modules: {
								auto: true,
								localIdentName: "[local]_[hash:base64:8]",
								exportGlobals: true,
							},
						},
					},
					"postcss-loader",
					{
						loader: "sass-loader",
					},
				],
			},
		],
	},
	optimization: {
		minimizer: [
			new CssMinimizerPlugin({
				minimizerOptions: {
					preset: [
						"default",
						{
							discardComments: { removeAll: true },
						},
					],
				},
			}),
			new TerserWebpackPlugin({
				terserOptions: {
					format: {
						comments: false,
					},
					compress: true,
				},
				minify: TerserWebpackPlugin.terserMinify,
				extractComments: false,
				exclude: [/useCases/],
			}),
		],
	},
});
