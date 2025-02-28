import { defineComponent } from "vue";

const app = defineComponent(
	() => {
		return () => {
			return <div class={"h-full w-full"}>hello world</div>;
		};
	},
	{
		name: "App",
	},
);

export default app;
