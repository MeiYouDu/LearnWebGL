import type { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router";
import HydrateFallback from "@/views/hydrateFallback.tsx";

const fundamentals: RouteObject[] = [
	{
		hydrateFallbackElement: HydrateFallback,
		children: [
			{
				index: true,
				path: "helloWorld",
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "helloWorld" */
								/* webpackPrefetch: true */
								"../views/helloWorld/index"
							)
						).default,
					};
				},
			},
			{
				path: "bezierLine",
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "bezierLine" */
								/* webpackPrefetch: true */
								"../views/bezierLine/index"
							)
						).default,
					};
				},
			},
			{
				path: "texture",
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "texture" */
								/* webpackPrefetch: true */
								"../views/texture/index"
							)
						).default,
					};
				},
			},
			{
				path: "coordinateSystem",
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "coordinateSystem" */
								/* webpackPrefetch: true */
								"../views/coordinateSystem/index"
							)
						).default,
					};
				},
			},
			{
				path: "camera",
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "camera" */
								/* webpackPrefetch: true */
								"../views/camera/index"
							)
						).default,
					};
				},
			},
		],
	},
];
const lights = [
	{
		path: "/light",
		children: [
			{
				path: "color",
				index: true,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "color" */
								/* webpackPrefetch: true */
								"../views/color/index"
							)
						).default,
					};
				},
			},
			{
				path: "material",
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "material" */
								/* webpackPrefetch: true */
								"../views/material/index"
							)
						).default,
					};
				},
			},
			{
				path: "lightMap",
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "lightMap" */
								/* webpackPrefetch: true */
								"../views/lightMap/index"
							)
						).default,
					};
				},
			},
			{
				path: "lightCaster",
				children: [
					{
						path: "parallelLight",
						lazy: async () => {
							return {
								Component: (
									await import(
										/* webpackChunkName: "parallelLight" */
										/* webpackPrefetch: true */
										"../views/lightCaster/parallelLight/index"
									)
								).default,
							};
						},
					},
					{
						path: "pointLight",
						lazy: async () => {
							return {
								Component: (
									await import(
										/* webpackChunkName: "pointLight" */
										/* webpackPrefetch: true */
										"../views/lightCaster/pointLight/index"
									)
								).default,
							};
						},
					},
					{
						path: "spotLight",
						lazy: async () => {
							return {
								Component: (
									await import(
										/* webpackChunkName: "spotLight" */
										/* webpackPrefetch: true */
										"../views/lightCaster/spotLight/index"
									)
								).default,
							};
						},
					},
					{
						path: "multipleLight",
						lazy: async () => {
							return {
								Component: (
									await import(
										/* webpackChunkName: "multipleLight" */
										/* webpackPrefetch: true */
										"../views/lightCaster/multipleLight/index"
									)
								).default,
							};
						},
					},
				],
			},
		],
	},
];

const routes: RouteObject[] = [
	...fundamentals,
	...lights,
	{
		path: "/imageProcess",
		children: [],
	},
	{
		path: "/geometry",
		children: [],
	},
];

const router = createBrowserRouter(routes);

export { routes };
export default router;
