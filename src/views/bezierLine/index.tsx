import { defineComponent, onMounted, ref, Ref } from "vue";
import { resizeHandle } from "../../helper/resize.ts";
import vertexShaderSource from "./vertex.glsl";
import fragmentShaderSource from "./fragment.glsl";
import { Shader } from "../../helper/shader.ts";
import { random } from "lodash";
import { mat4 } from "gl-matrix";

interface Mesh {
	vertexes: Float32Array;
	indices: Uint32Array;
}
function getLineMesh(length: number, width: number): Mesh {
	const vertexesArr: number[] = [];
	const indicesArr: number[] = [];
	for (let i = 0; i < length; i++) {
		for (let j = 0; j < 3; j++) {
			const x = random(-1, 1, true);
			const y = random(-1, 1, true);
			const r = j !== 2 ? random(0, 1, true) : 0;
			const g = j !== 1 ? random(0, 1, true) : 0;
			const b = j !== 0 ? random(0, 1, true) : 0;
			vertexesArr.push(x, y, 0, r, g, b);
			indicesArr.push(i * 3 + j);
		}
	}
	/**
	 * 顶点数据
	 */
	const vertexes = new Float32Array(vertexesArr);
	/**
	 * 索引
	 */
	const indices = new Uint32Array(indicesArr);
	return {
		vertexes,
		indices,
	};
}

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
		shaderInstance.use();
		const mesh = getLineMesh(8, 4);

		const vbo = gl.createBuffer(),
			ebo = gl.createBuffer(),
			vao = gl.createVertexArray();
		const positionAttributeLocation =
			shaderInstance.getAttribLocation("position");
		const colorAttributeLocation =
			shaderInstance.getAttribLocation("color");
		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
		// 传递数据
		gl.bufferData(
			gl.ARRAY_BUFFER,
			mesh.vertexes,
			gl.STATIC_DRAW,
		);
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			mesh.indices,
			gl.STATIC_DRAW,
		);
		if (typeof positionAttributeLocation === "number") {
			gl.vertexAttribPointer(
				positionAttributeLocation,
				3,
				gl.FLOAT,
				false,
				24,
				0,
			);
			gl.enableVertexAttribArray(positionAttributeLocation);
		}
		if (typeof colorAttributeLocation === "number") {
			gl.vertexAttribPointer(
				colorAttributeLocation,
				3,
				gl.FLOAT,
				false,
				24,
				12,
			);
			gl.enableVertexAttribArray(colorAttributeLocation);
		}
		let angle = 0;
		shaderInstance.setMatrix4(
			mat4.fromZRotation(mat4.create(), angle),
			"modelTrans",
		);
		function render() {
			if (!gl) return;
			if (instance.value) resizeHandle(instance.value, gl);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			shaderInstance.use();
			gl.bindVertexArray(vao);
			angle += 0.005;
			shaderInstance.setMatrix4(
				mat4.fromZRotation(mat4.create(), angle),
				"modelTrans",
			);
			gl.drawElements(gl.TRIANGLES, 24, gl.UNSIGNED_INT, 0);
			// gl.drawArrays(gl.TRIANGLES, 0, 3);
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
