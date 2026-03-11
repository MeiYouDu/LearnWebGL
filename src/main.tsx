import router from "@/routes";
import "@ant-design/v5-patch-for-react-19";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./styles/global.css";

const root = document.getElementById("app");

if (root) {
	createRoot(root).render(<RouterProvider router={router}></RouterProvider>);
}
