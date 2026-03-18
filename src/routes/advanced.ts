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
		],
	},
];

export { advanced };
