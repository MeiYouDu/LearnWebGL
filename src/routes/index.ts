import HydrateFallback from "@/views/hydrateFallback.tsx";
import Root from "@/views/Root";
import type { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router";
import { advanced } from "./advanced";
import { fundamentals } from "./fundamentals";
import { gaussian } from "./gaussian";
import { lights } from "./light";
import { pointCloud } from "./pointCloud";

const routes: RouteObject[] = [
	...fundamentals,
	...lights,
	{
		path: "/model",
		id: "model",
		children: [
			{
				index: true,
				path: "load",
				id: "load",
				hydrateFallbackElement: HydrateFallback,
				lazy: async () => {
					return {
						Component: (
							await import(
								/* webpackChunkName: "load" */
								/* webpackPrefetch: true */
								"@/views/modelLoad"
							)
						).default,
					};
				},
			},
		],

		Component: Root,
		hydrateFallbackElement: HydrateFallback,
	},
	...advanced,
	...gaussian,
	...pointCloud,
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
