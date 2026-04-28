import HydrateFallback from "@/views/hydrateFallback.tsx";
import Root from "@/views/Root";
import type { RouteObject } from "react-router";

const advanced: RouteObject[] = [
	{
		path: "/advanced",
		id: "advanced",
		Component: Root,
		hydrateFallbackElement: HydrateFallback,
		children: [
			{
				path: "depthTest",
				id: "depthTest",
				index: true,
				hydrateFallbackElement: HydrateFallback,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "depthTest" */
								/* webpackPrefetch: true */
								"@/views/advanced/depthTest"
							)
						).default,
					};
				},
			},
			{
				path: "stencilTest",
				id: "stencilTest",
				index: true,
				hydrateFallbackElement: HydrateFallback,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "stencilTest" */
								/* webpackPrefetch: true */
								"@/views/advanced/stencilTest"
							)
						).default,
					};
				},
			},
			{
				path: "blend",
				id: "blend",
				index: true,
				hydrateFallbackElement: HydrateFallback,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "blend" */
								/* webpackPrefetch: true */
								"@/views/advanced/blend"
							)
						).default,
					};
				},
			},
			{
				path: "faceCulling",
				id: "faceCulling",
				index: true,
				hydrateFallbackElement: HydrateFallback,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "faceCulling" */
								/* webpackPrefetch: true */
								"@/views/advanced/faceCulling"
							)
						).default,
					};
				},
			},
			{
				path: "frameBuffer",
				id: "frameBuffer",
				index: true,
				hydrateFallbackElement: HydrateFallback,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "frameBuffer" */
								/* webpackPrefetch: true */
								"@/views/advanced/frameBuffer"
							)
						).default,
					};
				},
			},
			{
				path: "cubeMaps",
				id: "cubeMaps",
				index: true,
				hydrateFallbackElement: HydrateFallback,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "cubeMaps" */
								/* webpackPrefetch: true */
								"@/views/advanced/cubeMaps"
							)
						).default,
					};
				},
			},
		],
	},
];

export { advanced };
