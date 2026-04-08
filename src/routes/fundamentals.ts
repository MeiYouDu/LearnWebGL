import HydrateFallback from "@/views/hydrateFallback.tsx";
import Root from "@/views/Root";
import type { RouteObject } from "react-router";
import { redirect } from "react-router";

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
			{
				path: "quaternion",
				id: "quaternion",
				hydrateFallbackElement: HydrateFallback,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "quaternion" */
								/* webpackPrefetch: true */
								"@/views/fundamentals/quaternion"
							)
						).default,
					};
				},
			},
		],
	},
];
export { fundamentals };
