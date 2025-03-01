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
		name: "root",
		component: () => import("../views/helloWorld.vue"),
	},
];

export default createRouter({
	history: createWebHistory(),
	routes,
});
