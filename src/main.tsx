import "./styles/index.scss";
import { createRoot } from "react-dom/client";
import "@ant-design/v5-patch-for-react-19";
import router from "@/routes";
import { RouterProvider } from "react-router";

const root = document.getElementById("app");

if (root) {
	createRoot(root).render(
		<RouterProvider router={router}></RouterProvider>,
	);
}
