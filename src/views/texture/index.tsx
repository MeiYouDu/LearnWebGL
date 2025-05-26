import { defineComponent, onMounted, ref, Ref } from "vue";
import { resizeHandle } from "../../helper/resize.ts";
import vertexShaderSource from "./vertex.glsl";
import fragmentShaderSource from "./fragment.glsl";
import { Shader } from "../../helper/shader.ts";
import { vec2 } from "gl-matrix";
import box from "./container.jpg";

// texture

interface Mesh {
	vertexes: Float32Array;
	indices: Uint32Array;
}

function getMesh(length: number): Mesh {
	/**
	 * 顶点数据
	 * x,y,z,r,g,b,s,t
	 */
	const vertexes = new Float32Array([
		-0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.5, 0.5,
		0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 0.0, 0.0,
		1.0, 1.0, 1.0, -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0,
		0.5, 0.5, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.5, -0.5, 0.0,
		1.0, 0.0, 1.0, 1.0, 0.0,
	]);
	/**
	 * 索引
	 */
	const indices = new Uint32Array([]);
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
		const mesh = getMesh(6);

		const vbo = gl.createBuffer(),
			ebo = gl.createBuffer(),
			vao = gl.createVertexArray(),
			texture = gl.createTexture();
		const positionAttributeLocation =
			shaderInstance.getAttribLocation("position");
		const colorAttributeLocation =
			shaderInstance.getAttribLocation("color");
		const texCoordAttributeLocation =
			shaderInstance.getAttribLocation("texCoord");
		gl.bindVertexArray(vao);
		gl.bindTexture(gl.TEXTURE_2D, texture);
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
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_S,
			gl.REPEAT,
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_T,
			gl.REPEAT,
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			gl.LINEAR_MIPMAP_LINEAR,
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MAG_FILTER,
			gl.LINEAR,
		);
		const image = new Image(512, 512);
		image.src = box;
		image.addEventListener("load", () => {
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGB,
				512,
				512,
				0,
				gl.RGB,
				gl.UNSIGNED_BYTE,
				image,
			);
			gl.generateMipmap(gl.TEXTURE_2D);
			image.remove();
		});
		if (
			typeof positionAttributeLocation === "number" &&
			positionAttributeLocation >= 0
		) {
			gl.vertexAttribPointer(
				positionAttributeLocation,
				3,
				gl.FLOAT,
				false,
				32,
				0,
			);
			gl.enableVertexAttribArray(positionAttributeLocation);
		}
		if (
			typeof colorAttributeLocation === "number" &&
			colorAttributeLocation >= 0
		) {
			gl.vertexAttribPointer(
				colorAttributeLocation,
				3,
				gl.FLOAT,
				false,
				32,
				12,
			);
			gl.enableVertexAttribArray(colorAttributeLocation);
		}
		if (
			typeof texCoordAttributeLocation === "number" &&
			texCoordAttributeLocation >= 0
		) {
			gl.vertexAttribPointer(
				texCoordAttributeLocation,
				2,
				gl.FLOAT,
				false,
				32,
				24,
			);
			gl.enableVertexAttribArray(texCoordAttributeLocation);
		}
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
			gl.drawArrays(gl.TRIANGLES, 0, 6);
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
