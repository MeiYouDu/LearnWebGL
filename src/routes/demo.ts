import HydrateFallback from "@/views/hydrateFallback.tsx";
import Root from "@/views/Root";
import type { RouteObject } from "react-router";
import { gaussian } from "./gaussian";
import { pointCloud } from "./pointCloud";
import { urdfLoader } from "./urdfLoader";

const demo: RouteObject[] = [
	{
		path: "/demo",
		id: "demo",
		Component: Root,
		hydrateFallbackElement: HydrateFallback,
		children: [gaussian, pointCloud, urdfLoader],
	},
];

export { demo };
