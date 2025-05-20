import { defineComponent, onMounted, ref, Ref } from "vue";
import { resizeHandle } from "../../helper/resize.ts";
import vertexShaderSource from "./vertex.glsl";
import fragmentShaderSource from "./fragment.glsl";
import { Shader } from "../../helper/shader.ts";

function main(
	instance: Ref<HTMLCanvasElement | undefined>,
) {
	onMounted(() => {
		if (!instance.value) return;
		const gl = instance.value.getContext("webgl2", {
			antialias: true,
			powerPreference: "high-performance",
		});
		if (!gl) return;

		const shaderInstance = new Shader(
			gl,
			vertexShaderSource,
			fragmentShaderSource,
		);
		/**
		 * 顶点数据
		 */
		const vertexes = new Float32Array([
			-0.5, -0.5, 0, 0.5, -0.5, 0, 0, 0.5, 0,
		]);
		const vbo = gl.createBuffer(),
			vao = gl.createVertexArray();
		const positionAttributeLocation =
			shaderInstance.getAttribLocation("position");
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bindVertexArray(vao);
		// 传递数据
		gl.bufferData(
			gl.ARRAY_BUFFER,
			vertexes,
			gl.STATIC_DRAW,
		);
		if (typeof positionAttributeLocation === "number") {
			gl.vertexAttribPointer(
				positionAttributeLocation,
				3,
				gl.FLOAT,
				false,
				0,
				0,
			);
			gl.enableVertexAttribArray(positionAttributeLocation);
		}

		function render() {
			if (!gl) return;
			if (instance.value) resizeHandle(instance.value, gl);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			shaderInstance.use();
			gl.bindVertexArray(vao);
			gl.drawArrays(gl.TRIANGLES, 0, vertexes.length / 3);
			requestAnimationFrame(render);
		}
		render();
	});
}

export default defineComponent({
	setup() {
		const canvasRef: Ref<HTMLCanvasElement | undefined> =
			ref();
		main(canvasRef);
		return function () {
			return <canvas ref={canvasRef}></canvas>;
		};
	},
});
