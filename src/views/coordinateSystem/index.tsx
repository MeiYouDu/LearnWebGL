import { Mesh } from "../../interface";
import { defineComponent, onMounted, ref, Ref } from "vue";
import { resizeHandle } from "../../helper/resize.ts";
import vertexShaderSource from "./vertex.glsl";
import fragmentShaderSource from "./fragment.glsl";
import { Shader } from "../../helper/shader.ts";
import { mat4, vec2, vec3 } from "gl-matrix";
import { pi } from "mathjs";
import smile from "./awesomeface.png";
import box from "./container.jpg";

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
		let mixFactor = 0.5;
		document.addEventListener("keydown", (ev) => {
			if (ev.key === "ArrowUp") mixFactor += 0.05;
			if (ev.key === "ArrowDown") mixFactor -= 0.05;
			if (mixFactor >= 1) {
				mixFactor = 1.0;
			}
			if (mixFactor <= 0.0) {
				mixFactor = 0.0;
			}
		});

		function render() {
			if (!gl) return;
			if (instance.value) resizeHandle(instance.value, gl);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.clearColor(0, 0, 0, 1);
			shaderInstance.use();
			gl.bindVertexArray(vao);
			shaderInstance.setVec2(
				vec2.fromValues(gl.canvas.width, gl.canvas.height),
				"resolution",
			);
			shaderInstance.setFloat(mixFactor, "mixFactor");
			shaderInstance.setMatrix4(
				mat4.fromRotation(
					mat4.create(),
					-(55 / 180) * pi * new Date().getTime() * 0.001,
					vec3.fromValues(1.0, 1.0, 1.0),
				),
				"model",
			);
			shaderInstance.setMatrix4(
				mat4.fromTranslation(
					mat4.create(),
					vec3.fromValues(0, 0, -3),
				),
				"view",
			);
			shaderInstance.setMatrix4(
				mat4.perspective(
					mat4.create(),
					pi / 4,
					gl.canvas.width / gl.canvas.height,
					1,
					Number.POSITIVE_INFINITY,
				),
				"projection",
			);
			gl.drawArrays(
				gl.TRIANGLES,
				0,
				mesh.vertexes.length / 5,
			);
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
