import HydrateFallback from "@/views/hydrateFallback.tsx";
import type { RouteObject } from "react-router";

const urdfLoader: RouteObject = {
	path: "urdfLoader",
	id: "urdfLoader",
	hydrateFallbackElement: HydrateFallback,
	lazy: async () => {
		return {
			Component: (
				await import(
					/* webpackChunkName: "urdfLoader" */
					/* webpackPrefetch: true */
					"@/views/urdfLoader"
				)
			).default,
		};
	},
};

export { urdfLoader };
