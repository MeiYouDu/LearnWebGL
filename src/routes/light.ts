import HydrateFallback from "@/views/hydrateFallback.tsx";
import Root from "@/views/Root";
import type { RouteObject } from "react-router";

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
						hydrateFallbackElement: HydrateFallback,
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
						hydrateFallbackElement: HydrateFallback,
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
						hydrateFallbackElement: HydrateFallback,
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
						hydrateFallbackElement: HydrateFallback,
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
export { lights };
