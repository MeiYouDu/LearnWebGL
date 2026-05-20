// CanvasComponent.tsx
import boxImage from "@/assets/textures/marble.jpg";
import groundImage from "@/assets/textures/metal.png";
import {
	Camera,
	FPSControl,
	Geometry,
	GeometryInstance,
	Scene,
	Shader,
	SpotLightMaterial,
} from "@/helperv1";
import vert from "@/helperv1/material/spotLightMaterial/spotLight.vert";
import { mat4, vec3 } from "gl-matrix";
import { cos, pi } from "mathjs";
import { useEffect, useRef } from "react";
import outlineFrag from "./outline.frag";
import frag from "./stencliTest.frag";
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
		const camera = new Camera({
			position: vec3.fromValues(0, -3, 0),
			front: vec3.fromValues(0, 1, 0),
			up: vec3.fromValues(0, 0, 1),
		});
		// create scene (保持与原来一致)
		const scene = new Scene({
			canvas,
			control: new FPSControl({
				speed: 0.5,
				camera,
			}),
			stencil: true,
		});
		sceneRef.current = scene;
		// deref gl，兼容你的 Scene 实现（如果是 WeakRef）
		const gl = scene.gl?.deref();
		if (!gl) {
			console.error("webgl2 context unavailable");
			return;
		}
		{
			gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
		}
		scene.camera.position = vec3.fromValues(0, -50, 0);
		// initial angle & light pos
		const angle = Date.now() * 0.001;
		const lightPos = vec3.fromValues(0, 0, 20);
		const boxMaterial = new SpotLightMaterial({
			shader: new Shader(vert, frag),
			textures: [
				{
					image: boxImage,
					width: 1024,
					height: 1024,
					textureUnit: 0,
					textureLocationName: "material.diffuse",
				},
			],
			uniformsSetter(gl: WebGL2RenderingContext, shaderInner) {
				shaderInner.setVec3(camera.position, "cameraPos");
				shaderInner.setVec3(vec3.fromValues(0, 0, -1), "light.direction");
				shaderInner.setFloat(cos(pi / 6), "light.cutOff");
				shaderInner.setFloat(cos(pi / 3), "light.outerCutOff");
				shaderInner.setVec3(vec3.fromValues(0.4, 0.4, 0.4), "light.ambient");
				shaderInner.setVec3(vec3.fromValues(0.9, 0.9, 0.9), "light.diffuse");
				shaderInner.setVec3(vec3.fromValues(1, 1, 1), "light.specular");
				shaderInner.setVec3(lightPos, "light.position");
				shaderInner.setFloat(1.0, "light.constant");
				shaderInner.setFloat(0.007, "light.linear");
				shaderInner.setFloat(0.0002, "light.quadratic");
				shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.ambient");
				shaderInner.setFloat(64.0, "material.shininess");
			},
			beforeDraw() {
				gl.stencilMask(0xff);
				gl.stencilFunc(gl.ALWAYS, 1, 0xff);
			},
		});
		const outlineMaterial = new SpotLightMaterial({
			shader: new Shader(vert, outlineFrag),
			beforeDraw() {
				// gl.disable(gl.DEPTH_TEST);
				gl.stencilMask(0x00);
				gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
			},
			afterDraw() {
				// gl.enable(gl.DEPTH_TEST);
				// gl.stencilMask(0xff);
				// gl.stencilFunc(gl.ALWAYS, 1, 0xff);
			},
		});
		const groundMaterial = new SpotLightMaterial({
			shader: new Shader(vert, frag),
			textures: [
				{
					image: groundImage,
					width: 1024,
					height: 1024,
					textureUnit: 1,
					textureLocationName: "material.diffuse",
				},
			],
			uniformsSetter(glInner: WebGL2RenderingContext, shaderInner) {
				shaderInner.setVec3(camera.position, "cameraPos");
				shaderInner.setVec3(vec3.fromValues(0, 0, -1), "light.direction");
				shaderInner.setFloat(cos(pi / 6), "light.cutOff");
				shaderInner.setFloat(cos(pi / 3), "light.outerCutOff");
				shaderInner.setVec3(vec3.fromValues(0.4, 0.4, 0.4), "light.ambient");
				shaderInner.setVec3(vec3.fromValues(0.9, 0.9, 0.9), "light.diffuse");
				shaderInner.setVec3(vec3.fromValues(1, 1, 1), "light.specular");
				shaderInner.setVec3(lightPos, "light.position");
				shaderInner.setFloat(1.0, "light.constant");
				shaderInner.setFloat(0.007, "light.linear");
				shaderInner.setFloat(0.0002, "light.quadratic");
				shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.ambient");
				shaderInner.setFloat(64.0, "material.shininess");
			},
		});
		// geometry & instances
		const boxGeometry = new Geometry({
			attributes: attribute,
			material: boxMaterial,
		});
		const boxOutline = new Geometry({
			attributes: attribute,
			material: outlineMaterial,
		});
		const groundGeometry = new Geometry({
			attributes: attribute,
			material: groundMaterial,
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
				mat4.fromTranslation(mat4.create(), vec3.fromValues(10.0, 15.0, 3.0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(10.0, 10.0, 10.0)),
			),
		});
		const outline1 = new GeometryInstance({
			geometry: boxOutline,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, 0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(10.5, 10.5, 10.5)),
			),
		});
		const outline2 = new GeometryInstance({
			geometry: boxOutline,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(10.0, 15.0, 3.0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(10.5, 10.5, 10.5)),
			),
		});
		const groundGeometryInstance = new GeometryInstance({
			geometry: groundGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, -5)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(1000.0, 1000.0, 1.0)),
			),
		});

		// register to scene (保持原逻辑)
		scene.add(groundGeometryInstance);
		scene.add(boxGeometryInstance);
		scene.add(boxGeometryInstance2);
		scene.add(outline1);
		scene.add(outline2);
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
