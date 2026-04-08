// CanvasComponent.tsx
import boxImage from "@/assets/textures/marble.jpg";
import {
	Camera,
	FPSControl,
	Geometry,
	GeometryInstance,
	Material,
	PNTAttribPointer,
	Scene,
	Shader,
} from "@/helperv1";
import { Slider, Switch } from "antd";
import { mat4, quat, vec3 } from "gl-matrix";
import { useEffect, useRef, useState } from "react";
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

export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);
	const intervalRef = useRef<NodeJS.Timeout>(undefined);
	const [mode, setMode] = useState(true);
	const geometry = useRef<GeometryInstance | undefined>(undefined);
	const angleRef = useRef<vec3>(vec3.create());

	function uniformsSetter(shaderInner: Material, lightPos: vec3) {
		shaderInner.setVec3((sceneRef.current as Scene).camera.position, "cameraPos");
		shaderInner.setFloat(0.7, "light.ambient");
		shaderInner.setFloat(0.95, "light.diffuse");
		shaderInner.setFloat(1.0, "light.specular");
		shaderInner.setVec3(lightPos, "light.position");
		shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.ambient");
		shaderInner.setFloat(1.0, "light.constant");
		shaderInner.setFloat(0.0135, "light.linear");
		shaderInner.setFloat(0.0014, "light.quadratic");
		shaderInner.setFloat(128.0, "material.shininess");
	}
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const camera = new Camera();
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
		scene.camera.position = vec3.fromValues(0, -8, 0);
		const angle = 0;
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
		// geometry & instances
		const boxGeometry = new Geometry({
			attributes: boxAttribute,
			material: boxMaterial,
		});
		const boxGeometryInstance = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, 0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(2.0, 2.0, 2.0)),
			),
		});
		geometry.current = boxGeometryInstance;
		scene.add(boxGeometryInstance);
		// intervalRef.current = setInterval(() => {
		// 	angle = new Date().getTime() * 0.0005;
		// 	lightPos[0] = Math.cos(angle) * 5;
		// 	lightPos[1] = Math.sin(angle) * 5;
		// }, 16);
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
	const initQuat = quat.create();

	function angleChangeHandle(value: number, index: number) {
		const radian = (value / 180) * Math.PI;
		if (!geometry.current) return;
		const init = mat4.multiply(
			mat4.create(),
			mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, 0)),
			mat4.fromScaling(mat4.create(), vec3.fromValues(2.0, 2.0, 2.0)),
		);
		// 欧拉角
		if (mode) {
			const mx = mat4.fromRotation(
				mat4.create(),
				angleRef.current[0],
				vec3.fromValues(1, 0, 0),
			);
			const my = mat4.fromRotation(
				mat4.create(),
				angleRef.current[1],
				vec3.fromValues(0, 1, 0),
			);
			const mz = mat4.fromRotation(
				mat4.create(),
				angleRef.current[2],
				vec3.fromValues(0, 0, 1),
			);
			geometry.current.matrix = mat4.mul(
				mat4.create(),
				init,
				mat4.mul(mat4.create(), mz, mat4.mul(mat4.create(), my, mx)),
			);
		} else {
			// 四元数
			const dif = radian - angleRef.current[index];
			const deltaQuat = quat.create();
			if (index === 0) {
				// X轴：通常使用局部轴旋转 (Pitch)
				quat.setAxisAngle(deltaQuat, [1, 0, 0], dif);
				// quat.multiply(initQuat, initQuat, deltaQuat); // 右乘 = 局部
				quat.multiply(initQuat, deltaQuat, initQuat); // 左乘 = 全局
			} else if (index === 1) {
				// Y轴：建议使用全局轴旋转 (Yaw)，符合操作直觉
				quat.setAxisAngle(deltaQuat, [0, 1, 0], dif);
				quat.multiply(initQuat, deltaQuat, initQuat); // 左乘 = 全局
			} else if (index === 2) {
				// Z轴：局部旋转 (Roll)
				quat.setAxisAngle(deltaQuat, [0, 0, 1], dif);
				// quat.multiply(initQuat, initQuat, deltaQuat);
				quat.multiply(initQuat, deltaQuat, initQuat); // 左乘 = 全局
			}
			geometry.current.matrix = mat4.mul(
				mat4.create(),
				init,
				mat4.fromQuat(mat4.create(), initQuat),
			);
		}
		angleRef.current[index] = radian;
	}

	// canvas 的样式/属性如需自定义可以把 width/height 作 props
	return (
		<div className="relative h-full w-full">
			<div className="absolute left-8 top-8 flex flex-col rounded bg-[rgba(255,255,255,0.5)] p-2">
				<Switch
					className="w-16"
					defaultChecked={mode}
					checkedChildren="欧拉角"
					unCheckedChildren="四元数"
					onChange={setMode}></Switch>
				<div className="flex w-60 items-center text-white">
					<span className="w-16">yaw:</span>
					<Slider
						className="w-[calc(100%-64px)]"
						defaultValue={angleRef.current[2]}
						min={-180}
						max={180}
						onChange={(value) => angleChangeHandle(value, 2)}
					/>
				</div>
				<div className="flex w-60 items-center text-white">
					<span className="w-16">pitch:</span>
					<Slider
						className="w-[calc(100%-64px)]"
						defaultValue={angleRef.current[0]}
						min={-180}
						max={180}
						onChange={(value) => angleChangeHandle(value, 0)}
					/>
				</div>
				<div className="flex w-60 items-center text-white">
					<span className="w-16">roll:</span>
					<Slider
						className="w-[calc(100%-64px)]"
						defaultValue={angleRef.current[1]}
						min={-180}
						max={180}
						onChange={(value) => angleChangeHandle(value, 1)}
					/>
				</div>
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
