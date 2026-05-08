// WebglTriangles.tsx
import { resizeHandle } from "@/helper/resize"; // 调整为你项目实际路径
import { Shader } from "@/helper/shader"; // 调整路径
import { mat4 } from "gl-matrix";
import { random } from "lodash";
import { useEffect, useRef } from "react";
import fragmentShaderSource from "./fragment.glsl";
import vertexShaderSource from "./vertex.glsl";

export default function WebglTriangles() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rafRef = useRef<number | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", {
			antialias: true,
			powerPreference: "high-performance",
		});
		if (!gl) {
			console.error("webgl2 not supported");
			return;
		}

		// Shader
		const shaderInstance = new Shader(gl, vertexShaderSource, fragmentShaderSource);
		shaderInstance.use();

		// 构建顶点与索引数据（与原实现一致）
		const vertexesArr: number[] = [];
		const indicesArr: number[] = [];
		for (let i = 0; i < 10; i++) {
			for (let j = 0; j < 3; j++) {
				const x = random(-1, 1, true);
				const y = random(-1, 1, true);
				const r = j !== 2 ? random(0, 1, true) : 0;
				const g = j !== 1 ? random(0, 1, true) : 0;
				const b = j !== 0 ? random(0, 1, true) : 0;
				// position(x,y,z) + color(r,g,b)
				vertexesArr.push(x, y, 0, r, g, b);
				indicesArr.push(i * 3 + j);
			}
		}

		const vertexes = new Float32Array(vertexesArr);
		const indices = new Uint32Array(indicesArr);

		// Create buffers and vao
		const vbo = gl.createBuffer();
		const ebo = gl.createBuffer();
		const vao = gl.createVertexArray();

		const positionAttributeLocation = shaderInstance.getAttribLocation("position");
		const colorAttributeLocation = shaderInstance.getAttribLocation("color");

		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);

		gl.bufferData(gl.ARRAY_BUFFER, vertexes, gl.STATIC_DRAW);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

		const STRIDE = 6 * 4; // 6 floats per vertex * 4 bytes

		if (typeof positionAttributeLocation === "number") {
			gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, STRIDE, 0);
			gl.enableVertexAttribArray(positionAttributeLocation);
		}

		if (typeof colorAttributeLocation === "number") {
			gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, STRIDE, 12);
			gl.enableVertexAttribArray(colorAttributeLocation);
		}

		// 初始变换
		let angle = 0;
		shaderInstance.setMatrix4(mat4.fromZRotation(mat4.create(), angle), "modelTrans");

		// Render loop
		function render() {
			if (!gl) return;
			// resize canvas -> viewport
			if (canvas) resizeHandle(canvas, gl);

			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			shaderInstance.use();
			gl.bindVertexArray(vao);

			angle += 0.005;
			shaderInstance.setMatrix4(mat4.fromZRotation(mat4.create(), angle), "modelTrans");

			gl.drawElements(gl.TRIANGLES, indicesArr.length, gl.UNSIGNED_INT, 0);

			rafRef.current = requestAnimationFrame(render);
		}

		rafRef.current = requestAnimationFrame(render);

		// cleanup on unmount
		return () => {
			if (rafRef.current != null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}

			try {
				// 解绑 VAO / buffer
				gl.bindVertexArray(null);
				gl.bindBuffer(gl.ARRAY_BUFFER, null);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

				if (vao) gl.deleteVertexArray(vao);
				if (vbo) gl.deleteBuffer(vbo);
				if (ebo) gl.deleteBuffer(ebo);
			} catch (e) {
				console.log(e);
			}
		};
	}, []);

	// canvas style 你可以根据需要修改（比如宽高等）
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
