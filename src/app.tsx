import { defineComponent } from "vue";
import { RouterView } from "vue-router";

const app = defineComponent(
	() => {
		return () => {
			return (
				<div class={"h-full w-full"}>
					<RouterView class={`h-full w-full`} />
				</div>
			);
		};
	},
	{
		name: "App",
	},
);

export default app;
