// CanvasComponent.tsx
import glassImage from "@/assets/textures/grass.png";
import boxImage from "@/assets/textures/marble.jpg";
import groundImage from "@/assets/textures/metal.png";
import windowImage from "@/assets/textures/window.png";
import {
	Camera,
	FPSControl,
	Geometry,
	GeometryInstance,
	Material,
	PNTAttribPointer,
	PTAttribPointer,
	Scene,
	Shader,
} from "@/helperv1";
import { Checkbox, Switch } from "antd";
import { mat4, vec3 } from "gl-matrix";
import { useEffect, useRef, useState } from "react";
import lightFrag from "./light.frag";
import frag from "./texture.frag";
import vert from "./texture.vert";
// attribute 与 Vue 版本保持一致
const boxAttribute = new Float32Array([
	// Back face
	-0.5, -0.5, -0.5, 0, 0, -1, 0.0, 0.0, 0.5, 0.5, -0.5, 0, 0, -1, 1.0, 1.0, 0.5, -0.5, -0.5, 0, 0,
	-1, 1.0, 0.0, 0.5, 0.5, -0.5, 0, 0, -1, 1.0, 1.0, -0.5, -0.5, -0.5, 0, 0, -1, 0.0, 0.0, -0.5,
	0.5, -0.5, 0, 0, -1, 0.0, 1.0,
	// Front face
	-0.5, -0.5, 0.5, 0, 0, 1, 0.0, 0.0, 0.5, -0.5, 0.5, 0, 0, 1, 1.0, 0.0, 0.5, 0.5, 0.5, 0, 0, 1,
	1.0, 1.0, 0.5, 0.5, 0.5, 0, 0, 1, 1.0, 1.0, -0.5, 0.5, 0.5, 0, 0, 1, 0.0, 1.0, -0.5, -0.5, 0.5,
	0, 0, 1, 0.0, 0.0,
	// Left face
	-0.5, 0.5, 0.5, -1, 0, 0, 1.0, 0.0, -0.5, 0.5, -0.5, -1, 0, 0, 1.0, 1.0, -0.5, -0.5, -0.5, -1,
	0, 0, 0.0, 1.0, -0.5, -0.5, -0.5, -1, 0, 0, 0.0, 1.0, -0.5, -0.5, 0.5, -1, 0, 0, 0.0, 0.0, -0.5,
	0.5, 0.5, -1, 0, 0, 1.0, 0.0,
	// Right face
	0.5, 0.5, 0.5, 1, 0, 0, 1.0, 0.0, 0.5, -0.5, -0.5, 1, 0, 0, 0.0, 1.0, 0.5, 0.5, -0.5, 1, 0, 0,
	1.0, 1.0, 0.5, -0.5, -0.5, 1, 0, 0, 0.0, 1.0, 0.5, 0.5, 0.5, 1, 0, 0, 1.0, 0.0, 0.5, -0.5, 0.5,
	1, 0, 0, 0.0, 0.0,
	// Bottom face
	-0.5, -0.5, -0.5, 0, -1, 0, 0.0, 1.0, 0.5, -0.5, -0.5, 0, -1, 0, 1.0, 1.0, 0.5, -0.5, 0.5, 0,
	-1, 0, 1.0, 0.0, 0.5, -0.5, 0.5, 0, -1, 0, 1.0, 0.0, -0.5, -0.5, 0.5, 0, -1, 0, 0.0, 0.0, -0.5,
	-0.5, -0.5, 0, -1, 0, 0.0, 1.0,
	// Top face
	-0.5, 0.5, -0.5, 0, 1, 0, 0.0, 1.0, 0.5, 0.5, 0.5, 0, 1, 0, 1.0, 0.0, 0.5, 0.5, -0.5, 0, 1, 0,
	1.0, 1.0, 0.5, 0.5, 0.5, 0, 1, 0, 1.0, 0.0, -0.5, 0.5, -0.5, 0, 1, 0, 0.0, 1.0, -0.5, 0.5, 0.5,
	0, 1, 0, 0.0, 0.0,
]);

const glassAttribute = new Float32Array([
	-0.5, -0.5, 0.0, 0.0, 0.0, -0.5, 0.5, 0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 1.0, 1.0, -0.5, -0.5, 0.0,
	0.0, 0.0, 0.5, 0.5, 0.0, 1.0, 1.0, 0.5, -0.5, 0.0, 1.0, 0.0,
]);

export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);
	const intervalRef = useRef<NodeJS.Timeout>(undefined);
	const [enableCullFace] = useState(true);
	const [backCull] = useState(true);
	const needCullMaterial = useRef<Array<Material>>([]);

	function uniformsSetter(shaderInner: Material, lightPos: vec3) {
		shaderInner.setVec3((sceneRef.current as Scene).camera.position, "cameraPos");
		shaderInner.setFloat(0.3, "light.ambient");
		shaderInner.setFloat(0.9, "light.diffuse");
		shaderInner.setFloat(1.0, "light.specular");
		shaderInner.setVec3(lightPos, "light.position");
		shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.ambient");
		shaderInner.setFloat(1.0, "light.constant");
		shaderInner.setFloat(0.027, "light.linear");
		shaderInner.setFloat(0.0028, "light.quadratic");
		shaderInner.setFloat(128.0, "material.shininess");
	}
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
				speed: 0.1,
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
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		}
		scene.camera.position = vec3.fromValues(0, -50, 0);
		let angle = 0;
		const lightPos = vec3.fromValues(Math.cos(angle) * 20, Math.sin(angle) * 20, 0);
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
				{
					image: boxImage,
					width: 256,
					height: 256,
					textureUnit: 5,
					textureLocationName: "material.specular",
				},
			],
			vertexAttribPointer: PNTAttribPointer,
			uniformsSetter: (...[, material]) => uniformsSetter(material, lightPos),
			culling: true,
		});
		needCullMaterial.current.push(boxMaterial);
		const lightMaterial = new Material({
			shader: new Shader(vert, lightFrag),
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
			uniformsSetter: (...[, material]) => uniformsSetter(material, lightPos),
			blend: true,
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
				{
					image: groundImage,
					width: 1024,
					height: 1024,
					textureUnit: 6,
					textureLocationName: "material.specular",
				},
			],
			vertexAttribPointer: PNTAttribPointer,
			uniformsSetter: (...[, material]) => uniformsSetter(material, lightPos),
		});
		const windowMaterial = new Material({
			shader: new Shader(vert, frag),
			textures: [
				{
					image: windowImage,
					width: 256,
					height: 256,
					textureUnit: 3,
					textureLocationName: "material.diffuse",
				},
				{
					image: windowImage,
					width: 256,
					height: 256,
					textureUnit: 4,
					textureLocationName: "material.specular",
				},
			],
			vertexAttribPointer: PTAttribPointer,
			uniformsSetter: (...[, material]) => uniformsSetter(material, lightPos),
			blend: true,
		});
		const lightGeometry = new Geometry({
			attributes: boxAttribute,
			material: lightMaterial,
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
		const windowGeometry = new Geometry({
			attributes: glassAttribute,
			material: windowMaterial,
		});
		const groundGeometry = new Geometry({
			attributes: boxAttribute,
			material: groundMaterial,
		});
		const boxGeometryInstance = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(-2, 0, 0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(2.0, 2.0, 2.0)),
			),
		});
		const boxGeometryInstance2 = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(2, 2, 0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(2.0, 2.0, 2.0)),
			),
		});
		const outline1 = new GeometryInstance({
			geometry: glassGeometry,
			matrix: mat4.mul(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(-2.0, -2.0, 0.0)),
				mat4.multiply(
					mat4.create(),
					mat4.fromXRotation(mat4.create(), -Math.PI / 2),
					mat4.fromScaling(mat4.create(), vec3.fromValues(1, 1, 1)),
				),
			),
		});
		const outline2 = new GeometryInstance({
			geometry: glassGeometry,
			matrix: mat4.mul(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(2.0, -2.0, 0.0)),
				mat4.multiply(
					mat4.create(),
					mat4.fromXRotation(mat4.create(), -Math.PI / 2),
					mat4.fromScaling(mat4.create(), vec3.fromValues(1, 1, 1)),
				),
			),
		});
		const windowInstance = new GeometryInstance({
			geometry: windowGeometry,
			matrix: mat4.mul(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(3.0, -4.0, 0.0)),
				mat4.multiply(
					mat4.create(),
					mat4.fromXRotation(mat4.create(), -Math.PI / 2),
					mat4.fromScaling(mat4.create(), vec3.fromValues(1, 1, 1)),
				),
			),
		});
		const windowInstance2 = new GeometryInstance({
			geometry: windowGeometry,
			matrix: mat4.mul(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(4.0, -6.0, 0.0)),
				mat4.multiply(
					mat4.create(),
					mat4.fromXRotation(mat4.create(), -Math.PI / 2),
					mat4.fromScaling(mat4.create(), vec3.fromValues(1, 1, 1)),
				),
			),
		});
		const groundGeometryInstance = new GeometryInstance({
			geometry: groundGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, -1)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(100, 100, 1.0)),
			),
		});
		const lightGeometryInstance = new GeometryInstance({
			geometry: lightGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), lightPos),
				mat4.fromScaling(mat4.create(), vec3.fromValues(0.5, 0.5, 0.5)),
			),
		});

		// register to scene (保持原逻辑)
		scene.add(groundGeometryInstance);
		scene.add(lightGeometryInstance);
		scene.add(boxGeometryInstance);
		scene.add(boxGeometryInstance2);
		scene.add(outline1);
		scene.add(outline2);
		scene.add(windowInstance);
		scene.add(windowInstance2);
		intervalRef.current = setInterval(() => {
			angle = new Date().getTime() * 0.0005;
			lightPos[0] = Math.cos(angle) * 5;
			lightPos[1] = Math.sin(angle) * 5;
			lightGeometryInstance.matrix = mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), lightPos),
				mat4.fromScaling(mat4.create(), vec3.fromValues(0.5, 0.5, 0.5)),
			);
		}, 16);
		return () => {
			clearInterval(intervalRef.current);
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
		<div className="relative h-full w-full">
			<div className="absolute left-8 top-8 flex flex-col rounded bg-[rgba(255,255,255,0.5)] p-2">
				<Checkbox
					defaultChecked={enableCullFace}
					onChange={(val) => {
						const gl = sceneRef.current?.gl.deref();
						if (!gl) return;
						needCullMaterial.current.forEach(
							(item) => (item.culling = val.target.checked),
						);
					}}>
					开启面剔除
				</Checkbox>
				<Switch
					defaultChecked={backCull}
					checkedChildren="剔除背面"
					unCheckedChildren="剔除正面"
					onChange={(val) => {
						const gl = sceneRef.current?.gl.deref();
						if (!gl) return;
						if (val) {
							gl.cullFace(gl.BACK);
						} else {
							gl.cullFace(gl.FRONT);
						}
					}}></Switch>
			</div>
			<canvas
				ref={canvasRef}
				style={{
					width: "100%",
					height: "100%",
					display: "block",
				}}
			/>
		</div>
	);
}
