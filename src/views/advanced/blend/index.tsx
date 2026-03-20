// CanvasComponent.tsx
import { useEffect, useRef } from "react";
import { mat4, vec3 } from "gl-matrix";
import {
	Scene,
	Geometry,
	GeometryInstance,
	FPSControl,
	Camera,
	Shader,
	PTAttribPointer,
	Material,
	PNTAttribPointer,
} from "@/helperv1";
import groundImage from "@/assets/textures/metal.png";
import boxImage from "@/assets/textures/marble.jpg";
import glassImage from "@/assets/textures/grass.png";
import vert from "./texture.vert";
import frag from "./texture.frag";
// attribute 与 Vue 版本保持一致
const boxAttribute = new Float32Array([
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

const glassAttribute = new Float32Array([
	-0.5, -0.5, 0.0, 0.0, 0.0, -0.5, 0.5, 0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 1.0, 1.0, -0.5, -0.5, 0.0,
	0.0, 0.0, 0.5, 0.5, 0.0, 1.0, 1.0, 0.5, -0.5, 0.0, 1.0, 0.0,
]);

export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const camera = new Camera();
		// create scene (保持与原来一致)
		const scene = new Scene({
			canvas,
			control: new FPSControl({
				speed: 1,
				camera,
			}),
			alpha: true,
		});
		sceneRef.current = scene;
		// deref gl，兼容你的 Scene 实现（如果是 WeakRef）
		const gl = scene.gl?.deref();
		if (!gl) {
			console.error("webgl2 context unavailable");
			return;
		}
		{
			gl.enable(gl.BLEND);
		}
		scene.camera.position = vec3.fromValues(0, -50, 0);

		const boxMaterial = new Material({
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
			vertexAttribPointer: PNTAttribPointer,
		});
		const glassMaterial = new Material({
			shader: new Shader(vert, frag),
			textures: [
				{
					image: glassImage,
					width: 512,
					height: 512,
					textureUnit: 1,
					textureLocationName: "material.diffuse",
				},
			],
			vertexAttribPointer: PTAttribPointer,
		});
		const groundMaterial = new Material({
			shader: new Shader(vert, frag),
			textures: [
				{
					image: groundImage,
					width: 1024,
					height: 1024,
					textureUnit: 2,
					textureLocationName: "material.diffuse",
				},
			],
			vertexAttribPointer: PNTAttribPointer,
		});
		// geometry & instances
		const boxGeometry = new Geometry({
			attributes: boxAttribute,
			material: boxMaterial,
		});
		const glassGeometry = new Geometry({
			attributes: glassAttribute,
			material: glassMaterial,
		});
		const groundGeometry = new Geometry({
			attributes: boxAttribute,
			material: groundMaterial,
		});
		const boxGeometryInstance = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(-10, 0, 0)),
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
			geometry: glassGeometry,
			matrix: mat4.mul(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(-20.0, -25.0, 0.0)),
				mat4.multiply(
					mat4.create(),
					mat4.fromXRotation(mat4.create(), -Math.PI / 2),
					mat4.fromScaling(mat4.create(), vec3.fromValues(10.5, 10.5, 10.5)),
				),
			),
		});
		const outline2 = new GeometryInstance({
			geometry: glassGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromXRotation(mat4.create(), -Math.PI / 2),
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
