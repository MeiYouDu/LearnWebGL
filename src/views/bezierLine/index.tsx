import { defineComponent, onMounted, ref, Ref } from "vue";
import { resizeHandle } from "../../helper/resize.ts";
// import "./bezier.glsl";
import vertexShaderSource from "./vertex.glsl";
import fragmentShaderSource from "./fragment.glsl";
import { Shader } from "../../helper/shader.ts";
import { vec2, vec4 } from "gl-matrix";
import { random } from "lodash";

interface Mesh {
	vertexes: Float32Array;
	indices: Uint32Array;
}

function getLineMesh(length: number): Mesh {
	/**
	 * 顶点数据
	 */
	const vertexes = new Float32Array(length * 4 + 16);
	/**
	 * 索引
	 */
	const indices = new Uint32Array(length + 4);
	for (let i = 0; i < length + 4; i++) {
		const index = i * 4;
		vertexes[index] = 0;
		vertexes[index + 1] = 0;
		vertexes[index + 2] = 0.0;
		if (i >= length) {
			// 控制点标识
			vertexes[index + 3] = -(i + 1 - length);
		} else {
			vertexes[index + 3] = i / length;
		}
		indices[i] = i;
	}

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
		const mesh = getLineMesh(256);

		const vbo = gl.createBuffer(),
			ebo = gl.createBuffer(),
			vao = gl.createVertexArray();
		const positionAttributeLocation =
			shaderInstance.getAttribLocation("position");
		const tAttributeLocation =
			shaderInstance.getAttribLocation("t");
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
		if (
			positionAttributeLocation &&
			positionAttributeLocation >= 0
		) {
			gl.vertexAttribPointer(
				positionAttributeLocation,
				3,
				gl.FLOAT,
				false,
				16,
				0,
			);
			gl.enableVertexAttribArray(positionAttributeLocation);
		}
		if (tAttributeLocation && tAttributeLocation >= 0) {
			gl.vertexAttribPointer(
				tAttributeLocation,
				1,
				gl.FLOAT,
				false,
				16,
				12,
			);
			gl.enableVertexAttribArray(tAttributeLocation);
		}
		shaderInstance.setVec4Array(
			new Array(4).fill(0).map(() => {
				return vec4.fromValues(
					random(-1, 1, true),
					random(-1, 1, true),
					0,
					1,
				);
			}),
			"points",
		);
		function render() {
			if (!gl) return;
			if (instance.value) resizeHandle(instance.value, gl);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			shaderInstance.use();
			gl.bindVertexArray(vao);
			shaderInstance.setVec2(
				vec2.fromValues(gl.canvas.width, gl.canvas.height),
				"resolution",
			);
			gl.drawArrays(
				gl.LINE_STRIP,
				0,
				mesh.indices.length - 4,
			);
			gl.drawArrays(gl.POINTS, mesh.indices.length - 4, 4);
			gl.drawArrays(gl.POINTS, mesh.indices.length - 3, 3);
			gl.drawArrays(gl.POINTS, mesh.indices.length - 2, 2);
			gl.drawArrays(gl.POINTS, mesh.indices.length - 1, 1);
			// gl.drawElements(
			// 	gl.POINTS,
			// 	4,
			// 	gl.UNSIGNED_INT,
			// 	mesh.indices.length,
			// );
			gl.finish();
			// requestAnimationFrame(render);
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
