import { StrictMode, useEffect } from "react";
import { redirect, RouterProvider } from "react-router";
import router from "@/routes";
import { Layout, Menu } from "antd";
import { GlobalContextProvider } from "@/store";

function getNav() {
	return (
		<Menu className={"h-full w-[256px]"}>
			{/*{menuItem(router.options.routes)}*/}
		</Menu>
	);
	// return defineComponent({
	// 	setup() {
	// 		const router = useRouter();
	// 		const activeName: Ref<string> = ref("welcome");
	//
	// 		router.afterEach((to) => {
	// 			activeName.value = to.name as string;
	// 		});
	//
	// 		function menuItem(routes: readonly RouteRecordRaw[]) {
	// 			return routes.map((item) => {
	// 				if (item.children && item.children.length > 0) {
	// 					return (
	// 						<ElSubMenu
	// 							index={item.name as string}
	// 							v-slots={{
	// 								title() {
	// 									return item.name;
	// 								},
	// 							}}>
	// 							{menuItem(item.children)}
	// 						</ElSubMenu>
	// 					);
	// 				} else {
	// 					return (
	// 						<ElMenuItem index={item.name as string}>
	// 							{item.name}
	// 						</ElMenuItem>
	// 					);
	// 				}
	// 			});
	// 		}
	//
	// 		return function () {
	// 			return (
	//
	// 			);
	// 		};
	// 	},
	// });
}

function App() {
	useEffect(() => {
		redirect("/helloWorld");
	}, []);
	return (
		<GlobalContextProvider>
			<StrictMode>
				<Layout className={"h-full w-full"}>
					<Layout.Sider width={256}>
						{getNav()}
					</Layout.Sider>
					<Layout>
						<Layout.Header>
							Header
						</Layout.Header>
						<Layout.Content>
							<RouterProvider
								router={
									router
								}></RouterProvider>
						</Layout.Content>
						<Layout.Footer>
							Footer
						</Layout.Footer>
					</Layout>
				</Layout>
			</StrictMode>
		</GlobalContextProvider>
	);
}

export default App;
