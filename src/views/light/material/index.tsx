// CanvasComponent.tsx
import { useEffect, useRef } from "react";
import { mat4, vec3 } from "gl-matrix";
import { Scene } from "../../../helper/scene.ts"; // 调整路径
import { Shader } from "../../../helper/shader.ts";
import { Geometry } from "../../../helper/geometry.ts";
import { GeometryInstance } from "../../../helper/geometryInstance.ts";
import boxVert from "./box.vert";
import boxFrag from "./box.frag";
import lightFrag from "./light.frag";
import smile from "../../../assets/image/awesomeface.png";
import box from "../../../assets/image/container.jpg"; // attribute 与 Vue 版本保持一致

// attribute 与 Vue 版本保持一致
const attribute = new Float32Array([
	-0.5, -0.5, -0.5, 0, 0, -1, 0, 0, 0.5, -0.5, -0.5, 0, 0, -1, 1, 0, 0.5, 0.5, -0.5, 0, 0, -1, 1,
	-1, 0.5, 0.5, -0.5, 0, 0, -1, 1, -1, -0.5, 0.5, -0.5, 0, 0, -1, 0, -1, -0.5, -0.5, -0.5, 0, 0,
	-1, 0, 0, -0.5, -0.5, 0.5, 0, 0, 1, 0, 0, 0.5, -0.5, 0.5, 0, 0, 1, 1, 0, 0.5, 0.5, 0.5, 0, 0, 1,
	1, -1, 0.5, 0.5, 0.5, 0, 0, 1, 1, -1, -0.5, 0.5, 0.5, 0, 0, 1, 0, -1, -0.5, -0.5, 0.5, 0, 0, 1,
	0, 0, -0.5, 0.5, 0.5, -1, 0, 0, 1, 0, -0.5, 0.5, -0.5, -1, 0, 0, 1, -1, -0.5, -0.5, -0.5, -1, 0,
	0, 0, -1, -0.5, -0.5, -0.5, -1, 0, 0, 0, -1, -0.5, -0.5, 0.5, -1, 0, 0, 0, 0, -0.5, 0.5, 0.5,
	-1, 0, 0, 1, 0, 0.5, 0.5, 0.5, 1, 0, 0, 1, 0, 0.5, 0.5, -0.5, 1, 0, 0, 1, -1, 0.5, -0.5, -0.5,
	1, 0, 0, 0, -1, 0.5, -0.5, -0.5, 1, 0, 0, 0, -1, 0.5, -0.5, 0.5, 1, 0, 0, 0, 0, 0.5, 0.5, 0.5,
	1, 0, 0, 1, 0, -0.5, -0.5, -0.5, 0, -1, 0, 0, -1, 0.5, -0.5, -0.5, 0, -1, 0, 1, -1, 0.5, -0.5,
	0.5, 0, -1, 0, 1, 0, 0.5, -0.5, 0.5, 0, -1, 0, 1, 0, -0.5, -0.5, 0.5, 0, -1, 0, 0, 0, -0.5,
	-0.5, -0.5, 0, -1, 0, 0, -1, -0.5, 0.5, -0.5, 0, 1, 0, 0, -1, 0.5, 0.5, -0.5, 0, 1, 0, 1, -1,
	0.5, 0.5, 0.5, 0, 1, 0, 1, 0, 0.5, 0.5, 0.5, 0, 1, 0, 1, 0, -0.5, 0.5, 0.5, 0, 1, 0, 0, 0, -0.5,
	0.5, -0.5, 0, 1, 0, 0, -1,
]);

function boxVertexAttribPointer(gl: WebGL2RenderingContext, shader: Shader): number {
	const stride = 8;
	const positionAttrLocation = shader.getAttribLocation("position");
	const normalAttrLocation = shader.getAttribLocation("normal");
	const texCoordAttrLocation = shader.getAttribLocation("texCoord");

	if (typeof positionAttrLocation === "number" && positionAttrLocation >= 0) {
		gl.vertexAttribPointer(positionAttrLocation, 3, gl.FLOAT, false, stride * 4, 0);
		gl.enableVertexAttribArray(positionAttrLocation);
	}
	if (typeof normalAttrLocation === "number" && normalAttrLocation >= 0) {
		gl.vertexAttribPointer(normalAttrLocation, 3, gl.FLOAT, false, stride * 4, 3 * 4);
		gl.enableVertexAttribArray(normalAttrLocation);
	}
	if (typeof texCoordAttrLocation === "number" && texCoordAttrLocation >= 0) {
		gl.vertexAttribPointer(texCoordAttrLocation, 2, gl.FLOAT, false, stride * 4, 6 * 4);
		gl.enableVertexAttribArray(texCoordAttrLocation);
	}
	return stride;
}

export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);
	const intervalRef = useRef<number | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// create scene (保持与原来一致)
		const scene = new Scene(canvas);
		sceneRef.current = scene;

		// deref gl，兼容你的 Scene 实现（如果是 WeakRef）
		const gl = scene.gl?.deref();
		if (!gl) {
			console.error("webgl2 context unavailable");
			return;
		}

		// initial angle & light pos
		let angle = Date.now() * 0.001;
		const lightPos = vec3.fromValues(Math.sin(angle) * 2, Math.cos(angle) * 2, -3);

		// shaders
		const boxShader = new Shader(gl, boxVert, boxFrag);
		const lightShader = new Shader(gl, boxVert, lightFrag);

		// geometry & instances
		const boxGeometry = new Geometry({
			shader: boxShader,
			attributes: attribute,
			vertexAttribPointer: boxVertexAttribPointer,
			texture: [
				{
					image: box,
					width: 512,
					height: 512,
					textureUnit: 0,
				},
				{
					image: smile,
					width: 476,
					height: 476,
					textureUnit: 1, // 注意：原 Vue 里第二个也写了 0，通常应为 1
				},
			],
			uniformsSetter(glInner: WebGL2RenderingContext, shaderInner: Shader) {
				shaderInner.setVec3(scene.camera.position, "cameraPos");
				shaderInner.setVec3(vec3.fromValues(0.2, 0.2, 0.2), "light.ambient");
				shaderInner.setVec3(vec3.fromValues(0.9, 0.2, 0.9), "light.diffuse");
				shaderInner.setVec3(vec3.fromValues(1, 1, 1), "light.specular");
				shaderInner.setVec3(lightPos, "light.position");
				shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.ambient");
				shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.diffuse");
				shaderInner.setVec3(vec3.fromValues(0.5, 0.5, 0.5), "material.specular");
				shaderInner.setFloat(32.0, "material.shininess");
			},
		});

		const lightGeometry = new Geometry({
			shader: lightShader,
			attributes: attribute,
			vertexAttribPointer: boxVertexAttribPointer,
		});

		const boxGeometryInstance = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, 0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(1.5, 1.5, 1.5)),
			),
		});

		const lightGeometryInstance = new GeometryInstance({
			geometry: lightGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), lightPos),
				mat4.fromScaling(mat4.create(), vec3.fromValues(0.1, 0.1, 0.1)),
			),
		});

		// register to scene (保持原逻辑)
		scene.geometryMap.set(boxGeometryInstance, boxGeometryInstance);
		scene.geometryMap.set(lightGeometryInstance, lightGeometryInstance);

		// setInterval 更新 lightPos（保留你要求的方案）
		const id = window.setInterval(() => {
			angle = Date.now() * 0.001;
			// 你原始逻辑里有 lightPos[1] = 3; 但后续又计算 x/z，保留原样：
			lightPos[1] = 3;
			lightPos[0] = Math.cos(angle) * 3;
			lightPos[2] = Math.sin(angle) * 3;

			// 更新实例的矩阵
			lightGeometryInstance.matrix = mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), lightPos),
				mat4.fromScaling(mat4.create(), vec3.fromValues(0.1, 0.1, 0.1)),
			);
		}, 1); // interval 1ms 与 Vue 保持一致

		intervalRef.current = id;

		// cleanup on unmount: clear interval and dispatch scene
		return () => {
			if (intervalRef.current != null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			try {
				// dispatch() 用于 Scene 做自身清理（你在 Vue 里也调用了它）
				sceneRef.current?.dispatch?.();
			} catch (e) {
				console.log(e);
			} finally {
				sceneRef.current = null;
			}
		};
	}, []); // 仅挂载一次

	// canvas 的样式/属性如需自定义可以把 width/height 作 props
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
