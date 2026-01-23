// TextureDemo.tsx
import { useEffect, useRef } from "react";
import { resizeHandle } from "@/helper/resize.ts"; // 路径按你的项目调整
import vertexShaderSource from "./vertex.glsl";
import fragmentShaderSource from "./fragment.glsl";
import { Shader } from "@/helper/shader.ts";
import { vec2 } from "gl-matrix";
import smile from "../../../assets/image/awesomeface.png";
import box from "../../../assets/image/container.jpg";

interface Mesh {
	vertexes: Float32Array;
	indices: Uint32Array;
}

function getMesh(): Mesh {
	// 与你原来一致：每顶点 8 个 float: x,y,z, r,g,b, s,t
	const vertexes = new Float32Array([
		-0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.5, 0.5,
		0.0, 0.0, 0.0, 1.0, 1.0, 1.0, -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0,
		0.0, 1.0, 1.0, 1.0, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0,
	]);
	const indices = new Uint32Array([]); // 这里用 drawArrays，所以 indices 为空
	return { vertexes, indices };
}

function setTextureParams(gl: WebGL2RenderingContext) {
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

export default function TextureDemo() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const mixFactorRef = useRef<number>(0.5);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", {
			antialias: true,
			powerPreference: "high-performance",
		}) as WebGL2RenderingContext | null;

		if (!gl) {
			console.error("WebGL2 not supported");
			return;
		}

		// Shader
		const shaderInstance = new Shader(gl, vertexShaderSource, fragmentShaderSource);
		shaderInstance.use();

		// Mesh & buffers
		const mesh = getMesh();
		const vbo = gl.createBuffer();
		const vao = gl.createVertexArray();

		const positionAttributeLocation = shaderInstance.getAttribLocation("position");
		const colorAttributeLocation = shaderInstance.getAttribLocation("color");
		const texCoordAttributeLocation = shaderInstance.getAttribLocation("texCoord");

		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexes, gl.STATIC_DRAW);

		const STRIDE = 8 * 4; // 8 floats * 4 bytes

		if (typeof positionAttributeLocation === "number" && positionAttributeLocation >= 0) {
			gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, STRIDE, 0);
			gl.enableVertexAttribArray(positionAttributeLocation);
		}
		if (typeof colorAttributeLocation === "number" && colorAttributeLocation >= 0) {
			gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, STRIDE, 12);
			gl.enableVertexAttribArray(colorAttributeLocation);
		}
		if (typeof texCoordAttributeLocation === "number" && texCoordAttributeLocation >= 0) {
			gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, STRIDE, 24);
			gl.enableVertexAttribArray(texCoordAttributeLocation);
		}

		// Textures
		const image0 = new Image();
		const image1 = new Image();
		let texture0: WebGLTexture | null = null;
		let texture1: WebGLTexture | null = null;

		// ensure crossOrigin if assets are served cross-origin (optional)
		// image0.crossOrigin = "anonymous";
		// image1.crossOrigin = "anonymous";

		const onImage0Load = () => {
			texture0 = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture0);
			setTextureParams(gl);
			// use HTMLImageElement overload
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image0);
			gl.generateMipmap(gl.TEXTURE_2D);
			shaderInstance.use();
			shaderInstance.setInt(0, "texture0");
			// tidy
			image0.removeEventListener("load", onImage0Load);
		};

		const onImage1Load = () => {
			texture1 = gl.createTexture();
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, texture1);
			setTextureParams(gl);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image1);
			gl.generateMipmap(gl.TEXTURE_2D);
			shaderInstance.use();
			shaderInstance.setInt(1, "texture1");
			image1.removeEventListener("load", onImage1Load);
		};

		image0.addEventListener("load", onImage0Load);
		image1.addEventListener("load", onImage1Load);
		image0.src = box;
		image1.src = smile;

		// keyboard control
		const onKeydown = (ev: KeyboardEvent) => {
			if (ev.key === "ArrowUp") {
				mixFactorRef.current = Math.min(1.0, mixFactorRef.current + 0.05);
			} else if (ev.key === "ArrowDown") {
				mixFactorRef.current = Math.max(0.0, mixFactorRef.current - 0.05);
			}
		};
		document.addEventListener("keydown", onKeydown);

		// render loop
		function render() {
			if (!gl) return;
			if (canvas) resizeHandle(canvas, gl);

			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			shaderInstance.use();
			gl.bindVertexArray(vao);

			// set resolution (pixel dims)
			shaderInstance.setVec2(
				vec2.fromValues(gl.canvas.width, gl.canvas.height),
				"resolution",
			);
			shaderInstance.setFloat(mixFactorRef.current, "mixFactor");

			// draw 6 vertices as triangles
			gl.drawArrays(gl.TRIANGLES, 0, 6);

			rafRef.current = requestAnimationFrame(render);
		}

		rafRef.current = requestAnimationFrame(render);

		// cleanup
		return () => {
			// cancel RAF
			if (rafRef.current != null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			// remove keyboard listener
			document.removeEventListener("keydown", onKeydown);
			// remove image listeners
			image0.removeEventListener("load", onImage0Load);
			image1.removeEventListener("load", onImage1Load);
			// try to delete GL resources
			try {
				gl.bindVertexArray(null);
				gl.bindBuffer(gl.ARRAY_BUFFER, null);
				gl.bindTexture(gl.TEXTURE_2D, null);

				if (vao) gl.deleteVertexArray(vao);
				if (vbo) gl.deleteBuffer(vbo);
				if (texture0) gl.deleteTexture(texture0);
				if (texture1) gl.deleteTexture(texture1);
			} catch (e) {
				console.log(e);
			}
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			style={{
				width: "100%",
				height: "100%",
				display: "block",
			}}
		/>
	);
}
