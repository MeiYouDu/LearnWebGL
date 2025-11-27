// LineSceneReact.tsx
import { useEffect, useRef } from "react";
import { resizeHandle } from "../../helper/resize";
import vertexShaderSource from "./vertex.glsl";
import fragmentShaderSource from "./fragment.glsl";
import { Shader } from "../../helper/shader";
import { vec2, vec4 } from "gl-matrix";
import { random } from "lodash";

interface Mesh {
	vertexes: Float32Array;
	indices: Uint32Array;
}

function getLineMesh(length: number): Mesh {
	const vertexes = new Float32Array(length * 4 + 16);
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
	return { vertexes, indices };
}

export default function LineSceneReact() {
	const canvasRef = useRef<HTMLCanvasElement | null>(
		null,
	);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", {
			antialias: true,
			powerPreference: "high-performance",
		});
		if (!gl) {
			console.error("WebGL2 not available");
			return;
		}

		const shaderInstance = new Shader(
			gl,
			vertexShaderSource,
			fragmentShaderSource,
		);
		shaderInstance.use();

		const mesh = getLineMesh(256);

		const vbo = gl.createBuffer();
		const ebo = gl.createBuffer();
		const vao = gl.createVertexArray();

		const positionAttributeLocation =
			shaderInstance.getAttribLocation("position");
		const tAttributeLocation =
			shaderInstance.getAttribLocation("t");

		gl.bindVertexArray(vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			mesh.vertexes,
			gl.STATIC_DRAW,
		);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			mesh.indices,
			gl.STATIC_DRAW,
		);

		// stride = 4 floats * 4 bytes = 16
		const stride = 16;

		if (
			typeof positionAttributeLocation === "number" &&
			positionAttributeLocation >= 0
		) {
			// position: vec3 at offset 0
			gl.vertexAttribPointer(
				positionAttributeLocation,
				3,
				gl.FLOAT,
				false,
				stride,
				0,
			);
			gl.enableVertexAttribArray(
				positionAttributeLocation,
			);
		}
		if (
			typeof tAttributeLocation === "number" &&
			tAttributeLocation >= 0
		) {
			// t: float at offset 12
			gl.vertexAttribPointer(
				tAttributeLocation,
				1,
				gl.FLOAT,
				false,
				stride,
				12,
			);
			gl.enableVertexAttribArray(tAttributeLocation);
		}

		// set 4 random vec4 points into uniform array "points"
		const points = new Array(4)
			.fill(0)
			.map(() =>
				vec4.fromValues(
					random(-1, 1, true),
					random(-1, 1, true),
					0,
					1,
				),
			);
		shaderInstance.setVec4Array(points, "points");

		// single render (matches your Vue code: no RAF loop)
		function renderOnce() {
			if (!gl) return;
			if (canvas) resizeHandle(canvas, gl);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			shaderInstance.use();
			gl.bindVertexArray(vao);

			shaderInstance.setVec2(
				vec2.fromValues(
					gl.canvas.width,
					gl.canvas.height,
				),
				"resolution",
			);

			// draw line strip for mesh.indices.length - 4 (like original)
			const lineCount = mesh.indices.length - 4;
			gl.drawArrays(gl.LINE_STRIP, 0, lineCount);

			// draw control points (the last 4 entries)
			// original Vue draws them by offsets: drawArrays POINTS starting at lineCount with counts 4,3,2,1
			// replicate exactly:
			gl.drawArrays(gl.POINTS, lineCount, 4);
			if (lineCount + 1 <= mesh.vertexes.length / 4)
				gl.drawArrays(gl.POINTS, lineCount + 1, 3);
			if (lineCount + 2 <= mesh.vertexes.length / 4)
				gl.drawArrays(gl.POINTS, lineCount + 2, 2);
			if (lineCount + 3 <= mesh.vertexes.length / 4)
				gl.drawArrays(gl.POINTS, lineCount + 3, 1);

			gl.finish();
		}

		renderOnce();

		// cleanup on unmount
		return () => {
			try {
				if (vao) gl.deleteVertexArray(vao);
				if (vbo) gl.deleteBuffer(vbo);
				if (ebo) gl.deleteBuffer(ebo);
			} catch {
				// ignore
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
