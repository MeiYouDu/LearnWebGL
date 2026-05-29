import HydrateFallback from "@/views/hydrateFallback.tsx";
import Root from "@/views/Root";
import type { RouteObject } from "react-router";
import { createBrowserRouter } from "react-router";
import { advanced } from "./advanced";
import { demo } from "./demo";
import { fundamentals } from "./fundamentals";
import { lights } from "./light";

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
	...demo,
];

const router = createBrowserRouter(routes);

export { routes };
export default router;
