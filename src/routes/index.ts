/**
 * 负责vue-router实例创建
 */
import {
	createRouter,
	createWebHistory,
	RouteRecordRaw,
} from "vue-router";

const routes: Array<RouteRecordRaw> = [
	{
		path: "/",
		name: "welcome",
		component: () =>
			import(
				/* webpackChunkName: "welcome" */
				/* webpackPrefetch: true */
				"../views/welcome"
			),
	},
	{
		path: "/fundamentals",
		name: "fundamentals",
		redirect: "/fundamentals/helloWorld",
		children: [
			{
				path: "helloWorld",
				name: "helloWorld",
				component: () =>
					import(
						/* webpackChunkName: "helloWorld" */
						/* webpackPrefetch: true */
						"../views/helloWorld/index"
					),
			},
			{
				path: "bezierLine",
				name: "bezierLine",
				component: () =>
					import(
						/* webpackChunkName: "bezierLine" */
						/* webpackPrefetch: true */
						"../views/bezierLine/index"
					),
			},
		],
	},
	{
		path: "/imageProcess",
		name: "imageProcess",
		children: [],
	},
	{
		path: "/geometry",
		name: "geometry",
		children: [],
	},
];

export default createRouter({
	history: createWebHistory(),
	routes,
});
