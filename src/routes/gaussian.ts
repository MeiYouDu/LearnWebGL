import HydrateFallback from "@/views/hydrateFallback.tsx";
import type { RouteObject } from "react-router";

const gaussian: RouteObject = {
	path: "gaussian",
	id: "gaussian",
	children: [
		{
			path: "GaussianSplats3D",
			id: "GaussianSplats3DDemo",
			hydrateFallbackElement: HydrateFallback,
			lazy: async () => {
				return {
					Component: (
						await import(
							/* webpackChunkName: "gaussian" */
							/* webpackPrefetch: true */
							"@/views/gaussian"
						)
					).GaussianSplats3DDemo,
				};
			},
		},
		{
			path: "spark",
			id: "sparkDemo",
			hydrateFallbackElement: HydrateFallback,
			lazy: async () => {
				return {
					Component: (
						await import(
							/* webpackChunkName: "gaussian" */
							/* webpackPrefetch: true */
							"@/views/gaussian/sparkDemo.tsx"
						)
					).SparkDemo,
				};
			},
		},
	],
};

export { gaussian };
