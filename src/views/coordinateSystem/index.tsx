import { Mesh } from "../../interface";
import { defineComponent, onMounted, ref, Ref } from "vue";
import { resizeHandle } from "../../helper/resize.ts";
import vertexShaderSource from "./vertex.glsl";
import fragmentShaderSource from "./fragment.glsl";
import { Shader } from "../../helper/shader.ts";
import { vec2, vec3 } from "gl-matrix";
import smile from "../../assets/image/awesomeface.png";
import box from "../../assets/image/container.jpg";
import { useInput } from "../../hook";

function getMesh(): Mesh {
	/**
	 * 顶点数据
	 * x,y,z,r,g,b,s,t
	 */
	const vertexes = new Float32Array([
		-0.5, -0.5, -0.5, 0.0, 0.0, 0.5, -0.5, -0.5, 1.0, 0.0,
		0.5, 0.5, -0.5, 1.0, 1.0, 0.5, 0.5, -0.5, 1.0, 1.0,
		-0.5, 0.5, -0.5, 0.0, 1.0, -0.5, -0.5, -0.5, 0.0, 0.0,
		-0.5, -0.5, 0.5, 0.0, 0.0, 0.5, -0.5, 0.5, 1.0, 0.0,
		0.5, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, 0.5, 1.0, 1.0, -0.5,
		0.5, 0.5, 0.0, 1.0, -0.5, -0.5, 0.5, 0.0, 0.0, -0.5,
		0.5, 0.5, 1.0, 0.0, -0.5, 0.5, -0.5, 1.0, 1.0, -0.5,
		-0.5, -0.5, 0.0, 1.0, -0.5, -0.5, -0.5, 0.0, 1.0, -0.5,
		-0.5, 0.5, 0.0, 0.0, -0.5, 0.5, 0.5, 1.0, 0.0, 0.5, 0.5,
		0.5, 1.0, 0.0, 0.5, 0.5, -0.5, 1.0, 1.0, 0.5, -0.5,
		-0.5, 0.0, 1.0, 0.5, -0.5, -0.5, 0.0, 1.0, 0.5, -0.5,
		0.5, 0.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.0, -0.5, -0.5,
		-0.5, 0.0, 1.0, 0.5, -0.5, -0.5, 1.0, 1.0, 0.5, -0.5,
		0.5, 1.0, 0.0, 0.5, -0.5, 0.5, 1.0, 0.0, -0.5, -0.5,
		0.5, 0.0, 0.0, -0.5, -0.5, -0.5, 0.0, 1.0, -0.5, 0.5,
		-0.5, 0.0, 1.0, 0.5, 0.5, -0.5, 1.0, 1.0, 0.5, 0.5, 0.5,
		1.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.0, -0.5, 0.5, 0.5, 0.0,
		0.0, -0.5, 0.5, -0.5, 0.0, 1.0,
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

function setTextureParams(gl: WebGL2RenderingContext) {
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
}

/**
 * 设置纹理
 * @param image
 * @param width
 * @param height
 */
function setTexture(
	gl: WebGL2RenderingContext,
	shaderInstance: Shader,
	image: string,
	width: number,
	height: number,
	textureUnit: number,
	textureLocationName?: string,
) {
	const imgInstance = new Image(width, height);
	imgInstance.addEventListener("load", () => {
		const texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		shaderInstance.setInt(
			textureUnit,
			textureLocationName || `texture${textureUnit}`,
		);
		setTextureParams(gl);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			width,
			height,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			imgInstance,
		);
		gl.generateMipmap(gl.TEXTURE_2D);
		imgInstance.remove();
	});
	imgInstance.src = image;
}

function main(
	instance: Ref<HTMLCanvasElement | undefined>,
) {
	const inputInstance = useInput(instance);
	const mixFactor = 0.65;
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
		gl.enable(gl.DEPTH_TEST);
		const mesh = getMesh();
		const vbo = gl.createBuffer(),
			ebo = gl.createBuffer(),
			vao = gl.createVertexArray();
		const positionAttributeLocation =
			shaderInstance.getAttribLocation("position");
		const texCoordAttributeLocation =
			shaderInstance.getAttribLocation("texCoord");
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
		setTexture(gl, shaderInstance, box, 512, 512, 0);
		setTexture(gl, shaderInstance, smile, 476, 476, 1);
		if (
			typeof positionAttributeLocation === "number" &&
			positionAttributeLocation >= 0
		) {
			gl.vertexAttribPointer(
				positionAttributeLocation,
				3,
				gl.FLOAT,
				false,
				20,
				0,
			);
			gl.enableVertexAttribArray(positionAttributeLocation);
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
				20,
				12,
			);
			gl.enableVertexAttribArray(texCoordAttributeLocation);
		}
		const positions = [
			vec3.fromValues(0, 0, 0),
			vec3.fromValues(2, 5, -15),
			vec3.fromValues(-1.5, 2.2, -2.5),
			vec3.fromValues(-3.8, -2, -12.3),
			vec3.fromValues(2.4, -0.4, -3.5),
			vec3.fromValues(-1.7, 3.0, -7.5),
			vec3.fromValues(1.3, -2.0, -2.5),
			vec3.fromValues(1.5, 2.0, -2.5),
			vec3.fromValues(1.5, 0.2, -1.5),
			vec3.fromValues(-1.3, 1.0, -1.5),
		];
		function render() {
			if (!gl) return;
			if (instance.value) resizeHandle(instance.value, gl);

			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.clearColor(0.2, 0.2, 0.2, 1);
			shaderInstance.use();
			gl.bindVertexArray(vao);
			shaderInstance.setVec2(
				vec2.fromValues(gl.canvas.width, gl.canvas.height),
				"resolution",
			);
			shaderInstance.setFloat(mixFactor, "mixFactor");
			positions.forEach((p) => {
				const { model, view, projection } =
					inputInstance.render(gl, p, 1);
				shaderInstance.setMatrix4(model, "model");
				shaderInstance.setMatrix4(view, "view");
				shaderInstance.setMatrix4(projection, "projection");
				gl.drawArrays(
					gl.TRIANGLES,
					0,
					mesh.vertexes.length / 5,
				);
			});
			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);
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
