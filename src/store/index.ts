import { ref } from "vue";
import { defineStore, createPinia } from "pinia";

export const useUserStore = defineStore("user", () => {
	const name = ref("yqm");
	return { name };
});

export default createPinia();
