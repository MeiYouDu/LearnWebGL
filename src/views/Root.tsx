import { StrictMode, useContext, useState } from "react";
import { Outlet, RouteObject, useNavigate } from "react-router";
import { Button, Layout, Menu, MenuProps } from "antd";
import { GlobalContext, GlobalContextProvider } from "@/store";
import { MenuFoldOutlined, MenuUnfoldOutlined, PieChartOutlined } from "@ant-design/icons";
import { routes } from "@/routes";

function menuItemFactory(routes: RouteObject[]): Required<MenuProps>["items"] {
	return routes
		.filter((item) => item.id)
		.map((route: RouteObject) => {
			return {
				key: route.path as string,
				label: route.id,
				type: "item",
				icon: <PieChartOutlined />,
				children:
					route.children && route.children.length > 0
						? menuItemFactory(route.children)
						: undefined,
			};
		});
}

function Navigator({ collapsed }: { collapsed: boolean }) {
	const { theme } = useContext(GlobalContext);
	const navigate = useNavigate();
	const menuItems: MenuProps["items"] = menuItemFactory(routes);
	const selectHandle: MenuProps["onSelect"] = function (info) {
		const path = info.keyPath.reverse().join("/");
		navigate(path);
	};
	return (
		<Menu
			className={"w-[auto]"}
			mode={"inline"}
			inlineCollapsed={collapsed}
			items={menuItems}
			theme={theme}
			onSelect={selectHandle}
		/>
	);
}

function Root() {
	const [collapsed, setCollapsed] = useState(false);
	function toggleCollapsed() {
		setCollapsed(!collapsed);
	}
	return (
		<GlobalContextProvider>
			<StrictMode>
				<Layout className="h-full w-full">
					<Layout.Header>
						<Button type="primary" onClick={toggleCollapsed}>
							{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
						</Button>
					</Layout.Header>
					<Layout>
						<Layout.Sider className="">
							<Navigator collapsed={collapsed} />
						</Layout.Sider>
						<Layout.Content>
							<Outlet></Outlet>
						</Layout.Content>
					</Layout>

					{/*<Layout.Footer>*/}
					{/*	Footer*/}
					{/*</Layout.Footer>*/}
				</Layout>
			</StrictMode>
		</GlobalContextProvider>
	);
}

export default Root;
