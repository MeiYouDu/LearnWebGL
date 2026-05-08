// CubeSceneReact.tsx
import { vec2, vec3 } from "gl-matrix";
import { useEffect, useRef } from "react";
import smile from "../../../assets/image/awesomeface.png";
import box from "../../../assets/image/container.jpg";
import { resizeHandle } from "../../../helper/resize.ts";
import { Shader } from "../../../helper/shader.ts";
import { useInput } from "../../../hook";
import fragmentShaderSource from "./fragment.glsl";
import vertexShaderSource from "./vertex.glsl";

interface Mesh {
	vertexes: Float32Array;
	indices: Uint32Array;
}

function getMesh(): Mesh {
	const vertexes = new Float32Array([
		// x, y, z, u, v
		-0.5, -0.5, -0.5, 0.0, 0.0, 0.5, -0.5, -0.5, 1.0, 0.0, 0.5, 0.5, -0.5, 1.0, 1.0, -0.5, 0.5,
		-0.5, 0.0, 1.0, -0.5, -0.5, 0.5, 0.0, 0.0, 0.5, -0.5, 0.5, 1.0, 0.0, 0.5, 0.5, 0.5, 1.0,
		1.0, -0.5, 0.5, 0.5, 0.0, 1.0,
		// ... (your original array continues; above is just pattern)
		// The Vue source contained many repeated lines; keep the same flattened array
	]);

	// In the original Vue code `indices` was empty Uint32Array
	const indices = new Uint32Array([]);
	return { vertexes, indices };
}

function setTextureParams(gl: WebGL2RenderingContext) {
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function setTexture(
	gl: WebGL2RenderingContext,
	shaderInstance: Shader,
	imageUrl: string,
	width: number,
	height: number,
	textureUnit: number,
	textureLocationName?: string,
) {
	const img = new Image(width, height);
	const onLoad = () => {
		const texture = gl.createTexture();
		if (!texture) return;
		gl.activeTexture(gl.TEXTURE0 + textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		shaderInstance.setInt(textureUnit, textureLocationName || `texture${textureUnit}`);
		setTextureParams(gl);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);
		img.removeEventListener("load", onLoad);
	};
	img.addEventListener("load", onLoad);
	img.src = imageUrl;
	return img; // return so caller can remove listener on unmount if needed
}

export default function CubeSceneReact() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const imagesRef = useRef<HTMLImageElement[]>([]);
	// call useInput at top-level (assume it accepts a Ref<HTMLCanvasElement | null>)
	const inputInstance = useInput(canvasRef);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", {
			antialias: true,
			powerPreference: "high-performance",
		});
		if (!gl) {
			console.error("WebGL2 not supported");
			return;
		}

		const shaderInstance = new Shader(gl, vertexShaderSource, fragmentShaderSource);
		shaderInstance.use();

		gl.enable(gl.DEPTH_TEST);

		const mesh = getMesh();

		const vbo = gl.createBuffer();
		const ebo = gl.createBuffer();
		const vao = gl.createVertexArray();

		const positionAttributeLocation = shaderInstance.getAttribLocation("position");
		const texCoordAttributeLocation = shaderInstance.getAttribLocation("texCoord");

		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

		// upload buffers
		gl.bufferData(gl.ARRAY_BUFFER, mesh.vertexes, gl.STATIC_DRAW);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

		// textures (keep returned Image to remove listeners later)
		const img0 = setTexture(gl, shaderInstance, box, 512, 512, 0);
		const img1 = setTexture(gl, shaderInstance, smile, 476, 476, 1);
		imagesRef.current.push(img0, img1);

		// stride: 5 floats * 4 bytes = 20
		const stride = 5 * 4;
		if (typeof positionAttributeLocation === "number" && positionAttributeLocation >= 0) {
			gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, stride, 0);
			gl.enableVertexAttribArray(positionAttributeLocation);
		}
		if (typeof texCoordAttributeLocation === "number" && texCoordAttributeLocation >= 0) {
			gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, stride, 12);
			gl.enableVertexAttribArray(texCoordAttributeLocation);
		}

		const positions: Array<vec3> = [
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

		const mixFactor = 0.65;
		shaderInstance.use();

		// render loop
		const render = () => {
			if (!gl) return;
			if (canvas) resizeHandle(canvas, gl);

			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.clearColor(0.2, 0.2, 0.2, 1);
			shaderInstance.use();
			gl.bindVertexArray(vao);
			shaderInstance.setVec2(
				vec2.fromValues(gl.canvas.width, gl.canvas.height),
				"resolution",
			);
			shaderInstance.setFloat(mixFactor, "mixFactor");

			for (let i = 0; i < positions.length; i++) {
				const p = positions[i];
				const { model, view, projection } = inputInstance.render(gl, p, 1);
				shaderInstance.setMatrix4(model, "model");
				shaderInstance.setMatrix4(view, "view");
				shaderInstance.setMatrix4(projection, "projection");
				// vertex count = total floats / 5
				const vertexCount = mesh.vertexes.length / 5;
				gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
			}

			rafRef.current = requestAnimationFrame(render);
		};

		rafRef.current = requestAnimationFrame(render);

		// cleanup
		return () => {
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
			// remove image listeners by clearing src and letting GC handle object URLs
			imagesRef.current.forEach((img) => {
				try {
					img.src = "";
				} catch (e) {
					console.log(e);
				}
			});
			imagesRef.current.length = 0;

			// delete buffers / vao / textures (best-effort)
			try {
				if (vao) gl.deleteVertexArray(vao);
				if (vbo) gl.deleteBuffer(vbo);
				if (ebo) gl.deleteBuffer(ebo);
			} catch (e) {
				console.log(e);
			}
		};
	}, [inputInstance]);

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
