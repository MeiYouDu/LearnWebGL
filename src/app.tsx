import { defineComponent, h, Ref, ref } from "vue";
import {
	RouteRecordRaw,
	RouterView,
	useRouter,
} from "vue-router";
import {
	ElMenu,
	ElMenuItem,
	ElSubMenu,
} from "element-plus";

function getNav() {
	return defineComponent({
		setup() {
			const router = useRouter();
			const activeName: Ref<string> = ref("welcome");

			router.afterEach((to) => {
				activeName.value = to.name as string;
			});

			function menuItem(routes: readonly RouteRecordRaw[]) {
				return routes.map((item) => {
					if (item.children && item.children.length > 0) {
						return (
							<ElSubMenu
								index={item.name as string}
								v-slots={{
									title() {
										return item.name;
									},
								}}>
								{menuItem(item.children)}
							</ElSubMenu>
						);
					} else {
						return (
							<ElMenuItem index={item.name as string}>
								{item.name}
							</ElMenuItem>
						);
					}
				});
			}

			return function () {
				return (
					<ElMenu
						class={"h-full w-[256px]"}
						defaultActive={activeName.value}
						onSelect={(name) => {
							router.push({
								name,
							});
						}}>
						{menuItem(router.options.routes)}
					</ElMenu>
				);
			};
		},
	});
}

const app = defineComponent({
	name: "App",
	setup() {
		return function () {
			return (
				<div class={"flex h-full w-full"}>
					{h(getNav())}
					<RouterView
						class={"h-full w-[calc(100%-256px)]"}
					/>
				</div>
			);
		};
	},
});

export default app;
