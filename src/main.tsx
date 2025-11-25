import "./styles/index.scss";
import { createRoot } from "react-dom/client";
import App from "@/app";
import "@ant-design/v5-patch-for-react-19";

const root = document.getElementById("app");

if (root) {
	createRoot(root).render(<App />);
}
