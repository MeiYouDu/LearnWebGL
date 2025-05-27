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
			{
				path: "texture",
				name: "texture",
				component: () =>
					import(
						/* webpackChunkName: "texture" */
						/* webpackPrefetch: true */
						"../views/texture/index"
					),
			},
			{
				path: "coordinateSystem",
				name: "coordinateSystem",
				component: () =>
					import(
						/* webpackChunkName: "coordinateSystem" */
						/* webpackPrefetch: true */
						"../views/coordinateSystem/index"
					),
			},
			{
				path: "camera",
				name: "camera",
				component: () =>
					import(
						/* webpackChunkName: "camera" */
						/* webpackPrefetch: true */
						"../views/camera/index"
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
