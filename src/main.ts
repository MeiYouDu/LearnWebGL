import "./styles/index.css";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import { createApp } from "vue";
import router from "./routes";
import store from "./store";
import App from "./app.tsx";
import UtilsPlugin from "./plugins/utils.plugin.ts";

const app: ReturnType<typeof createApp> = createApp(App);
app.use(router);
app.use(store);
app.use(new UtilsPlugin());
app.mount("body");
