import type { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router";
import HydrateFallback from "@/views/hydrateFallback.tsx";
import Root from "@/views/Root";

const fundamentals: RouteObject[] = [
	{
		path: "/",
		id: "fundamentals",
		Component: Root,
		hydrateFallbackElement: HydrateFallback,
		children: [
			{
				index: true,
				path: "helloWorld",
				id: "helloWorld",
				hydrateFallbackElement: HydrateFallback,
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
				id: "bezierLine",
				hydrateFallbackElement: HydrateFallback,
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
				id: "texture",
				hydrateFallbackElement: HydrateFallback,
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
				id: "coordinateSystem",
				hydrateFallbackElement: HydrateFallback,
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
				id: "camera",
				hydrateFallbackElement: HydrateFallback,
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
const lights: RouteObject[] = [
	{
		path: "/light",
		id: "light",
		Component: Root,
		children: [
			{
				path: "color",
				id: "color",
				index: true,
				hydrateFallbackElement: HydrateFallback,
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
				id: "material",
				hydrateFallbackElement: HydrateFallback,
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
				id: "lightMap",
				hydrateFallbackElement: HydrateFallback,
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
				id: "lightCaster",
				children: [
					{
						path: "parallelLight",
						id: "parallelLight",
						hydrateFallbackElement:
							HydrateFallback,
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
						id: "pointLight",
						hydrateFallbackElement:
							HydrateFallback,
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
						id: "spotLight",
						hydrateFallbackElement:
							HydrateFallback,
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
						id: "multipleLight",
						hydrateFallbackElement:
							HydrateFallback,
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
		id: "imageProcess",
		children: [],
	},
	{
		path: "/geometry",
		id: "geometry",
		children: [],
	},
];

const router = createBrowserRouter(routes);

export { routes };
export default router;
