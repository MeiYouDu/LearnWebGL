// CanvasComponent.tsx
import { useEffect, useRef } from "react";
import { mat4, vec3 } from "gl-matrix";
import { Scene, Geometry, GeometryInstance } from "@/helperv1";
import { DepthMaterial } from "./depthMaterial";

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

export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// create scene (保持与原来一致)
		const scene = new Scene({ canvas });
		sceneRef.current = scene;

		// deref gl，兼容你的 Scene 实现（如果是 WeakRef）
		const gl = scene.gl?.deref();
		if (!gl) {
			console.error("webgl2 context unavailable");
			return;
		}
		scene.camera.position = vec3.fromValues(0, -50, 0);

		// initial angle & light pos
		const angle = Date.now() * 0.001;
		const lightPos = vec3.fromValues(Math.sin(angle) * 2, Math.cos(angle) * 2, -3);

		// shaders
		// const boxShader = new Shader(gl, boxVert, boxFrag);
		// const lightShader = new Shader(gl, boxVert, lightFrag);
		const material = new DepthMaterial({
			uniformsSetter(glInner: WebGL2RenderingContext, shaderInner) {
				shaderInner.setVec3(scene.camera.position, "cameraPos");
				shaderInner.setVec3(vec3.fromValues(0.2, 0.2, 0.2), "light.ambient");
				shaderInner.setVec3(vec3.fromValues(0.9, 0.2, 0.9), "light.diffuse");
				shaderInner.setVec3(vec3.fromValues(1, 1, 1), "light.specular");
				shaderInner.setVec3(lightPos, "light.position");
				shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.ambient");
				shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.diffuse");
				shaderInner.setVec3(vec3.fromValues(0.5, 0.5, 0.5), "material.specular");
				shaderInner.setFloat(32.0, "material.shininess");
				shaderInner.setFloat(1000, "far");
				shaderInner.setFloat(1, "near");
			},
		});
		// geometry & instances
		const boxGeometry = new Geometry({
			attributes: attribute,
			material,
		});
		const boxGeometryInstance = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, 0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(10.0, 10.0, 10.0)),
			),
		});
		const boxGeometryInstance2 = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(50.0, 200.0, 3.0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(10.0, 10.0, 10.0)),
			),
		});

		// register to scene (保持原逻辑)
		scene.add(boxGeometryInstance);
		scene.add(boxGeometryInstance2);

		return () => {
			try {
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
