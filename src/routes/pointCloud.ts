import HydrateFallback from "@/views/hydrateFallback.tsx";
import Root from "@/views/Root";
import type { RouteObject } from "react-router";

const pointCloud: RouteObject[] = [
	{
		path: "/pointCloud",
		id: "pointCloud",
		Component: Root,
		hydrateFallbackElement: HydrateFallback,
		children: [
			{
				path: "pcd",
				id: "pcd",
				hydrateFallbackElement: HydrateFallback,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "pcd" */
								/* webpackPrefetch: true */
								"@/views/pointCloud"
							)
						).default,
					};
				},
			},
		],
	},
];

export { pointCloud };
