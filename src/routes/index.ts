import type { RouteObject } from "react-router";
import {
	createBrowserRouter,
	redirect,
} from "react-router";
import HydrateFallback from "@/views/hydrateFallback.tsx";
import Root from "@/views/Root";

const fundamentals: RouteObject[] = [
	{
		path: "/",
		index: true,
		Component: Root,
		hydrateFallbackElement: HydrateFallback,
		loader() {
			return redirect("/fundamentals/helloWorld");
		},
	},
	{
		path: "/fundamentals",
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
								"@/views/fundamentals/helloWorld/index"
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
								"@/views/fundamentals/bezierLine/index"
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
								"@/views/fundamentals/texture/index"
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
								"@/views/fundamentals/coordinateSystem/index"
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
								"@/views/fundamentals/camera/index"
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
		hydrateFallbackElement: HydrateFallback,
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
								"@/views/light/color/index"
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
								"@/views/light/material/index"
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
								"@/views/light/lightMap/index"
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
										"@/views/light/lightCaster/parallelLight/index"
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
										"@/views/light/lightCaster/pointLight/index"
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
										"@/views/light/lightCaster/spotLight/index"
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
										"@/views/light/lightCaster/multipleLight/index"
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
		Component: Root,
		hydrateFallbackElement: HydrateFallback,
	},
	{
		path: "/geometry",
		id: "geometry",
		children: [],
		Component: Root,
		hydrateFallbackElement: HydrateFallback,
	},
];

const router = createBrowserRouter(routes);

export { routes };
export default router;
