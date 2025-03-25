import { convertToHtml } from "mammoth";
import { defineComponent, ref } from "vue";

export default defineComponent({
	setup() {
		const docRef = ref<HTMLDivElement>();

		return function () {
			return (
				<div class={"h-full w-full"}>
					<label for={"test"}></label>
					<input
						name={"test"}
						id={"test"}
						title={"test"}
						type={"file"}
						onChange={async (ev: Event) => {
							const files = (ev.target as HTMLInputElement)
								.files;
							if (!files) return;
							const file = files[0];
							if (!(file instanceof File)) return;
							const buffer = await file.arrayBuffer();
							const html = await convertToHtml(
								{
									arrayBuffer: buffer,
								},
								{
									includeDefaultStyleMap: true,
									// includeEmbeddedStyleMap: true,
								},
							);
							if (docRef.value) {
								docRef.value.innerHTML = html.value;
							}
						}}
					/>
					<div
						ref={docRef}
						class={"h-[500px] w-[500px]"}></div>
				</div>
			);
		};
	},
});
