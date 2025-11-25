// BoxSceneReact.tsx
import React, { useEffect, useRef } from "react";
import { cos, pi, sin } from "mathjs";
import { mat4, vec3 } from "gl-matrix";
import { random } from "lodash";
import { Scene } from "../../../helper/scene";
import { Shader } from "../../../helper/shader";
import { Geometry } from "../../../helper/geometry";
import { GeometryInstance } from "../../../helper/geometryInstance";
import boxVert from "./box.vert";
import boxFrag from "./box.frag";
import lightFrag from "./light.frag";
import boxBorder from "../../../assets/textures/container2_specular.png";
import box from "../../../assets/textures/container2.png";

const attribute = new Float32Array([
	-0.5, -0.5, -0.5, 0, 0, -1, 0, 0, 0.5, -0.5, -0.5, 0, 0,
	-1, 1, 0, 0.5, 0.5, -0.5, 0, 0, -1, 1, -1, 0.5, 0.5,
	-0.5, 0, 0, -1, 1, -1, -0.5, 0.5, -0.5, 0, 0, -1, 0, -1,
	-0.5, -0.5, -0.5, 0, 0, -1, 0, 0, -0.5, -0.5, 0.5, 0, 0,
	1, 0, 0, 0.5, -0.5, 0.5, 0, 0, 1, 1, 0, 0.5, 0.5, 0.5,
	0, 0, 1, 1, -1, 0.5, 0.5, 0.5, 0, 0, 1, 1, -1, -0.5,
	0.5, 0.5, 0, 0, 1, 0, -1, -0.5, -0.5, 0.5, 0, 0, 1, 0,
	0, -0.5, 0.5, 0.5, -1, 0, 0, 1, 0, -0.5, 0.5, -0.5, -1,
	0, 0, 1, -1, -0.5, -0.5, -0.5, -1, 0, 0, 0, -1, -0.5,
	-0.5, -0.5, -1, 0, 0, 0, -1, -0.5, -0.5, 0.5, -1, 0, 0,
	0, 0, -0.5, 0.5, 0.5, -1, 0, 0, 1, 0, 0.5, 0.5, 0.5, 1,
	0, 0, 1, 0, 0.5, 0.5, -0.5, 1, 0, 0, 1, -1, 0.5, -0.5,
	-0.5, 1, 0, 0, 0, -1, 0.5, -0.5, -0.5, 1, 0, 0, 0, -1,
	0.5, -0.5, 0.5, 1, 0, 0, 0, 0, 0.5, 0.5, 0.5, 1, 0, 0,
	1, 0, -0.5, -0.5, -0.5, 0, -1, 0, 0, -1, 0.5, -0.5,
	-0.5, 0, -1, 0, 1, -1, 0.5, -0.5, 0.5, 0, -1, 0, 1, 0,
	0.5, -0.5, 0.5, 0, -1, 0, 1, 0, -0.5, -0.5, 0.5, 0, -1,
	0, 0, 0, -0.5, -0.5, -0.5, 0, -1, 0, 0, -1, -0.5, 0.5,
	-0.5, 0, 1, 0, 0, -1, 0.5, 0.5, -0.5, 0, 1, 0, 1, -1,
	0.5, 0.5, 0.5, 0, 1, 0, 1, 0, 0.5, 0.5, 0.5, 0, 1, 0, 1,
	0, -0.5, 0.5, 0.5, 0, 1, 0, 0, 0, -0.5, 0.5, -0.5, 0, 1,
	0, 0, -1,
]);

function boxVertexAttribPointer(
	gl: WebGL2RenderingContext,
	shader: Shader,
): number {
	const stride = 8;
	const positionAttrLocation =
		shader.getAttribLocation("position");
	const normalAttrLocation =
		shader.getAttribLocation("normal");
	const texCoordAttrLocation =
		shader.getAttribLocation("texCoord");
	if (
		typeof positionAttrLocation === "number" &&
		positionAttrLocation >= 0
	) {
		gl.vertexAttribPointer(
			positionAttrLocation,
			3,
			gl.FLOAT,
			false,
			stride * 4,
			0,
		);
		gl.enableVertexAttribArray(positionAttrLocation);
	}
	if (
		typeof normalAttrLocation === "number" &&
		normalAttrLocation >= 0
	) {
		gl.vertexAttribPointer(
			normalAttrLocation,
			3,
			gl.FLOAT,
			false,
			stride * 4,
			3 * 4,
		);
		gl.enableVertexAttribArray(normalAttrLocation);
	}
	if (
		typeof texCoordAttrLocation === "number" &&
		texCoordAttrLocation >= 0
	) {
		gl.vertexAttribPointer(
			texCoordAttrLocation,
			2,
			gl.FLOAT,
			false,
			stride * 4,
			6 * 4,
		);
		gl.enableVertexAttribArray(texCoordAttrLocation);
	}
	return stride;
}

export default function BoxSceneReact() {
	const canvasRef = useRef<HTMLCanvasElement | null>(
		null,
	);
	const sceneRef = useRef<Scene | null>(null);
	const intervalRef = useRef<number | null>(null);

	useEffect(() => {
		let localScene: Scene | null = null;
		const canvas = canvasRef.current;
		if (!canvas) return;

		localScene = new Scene(canvas);
		sceneRef.current = localScene;

		const gl = localScene.gl.deref();

		if (!gl) {
			console.error("webgl2 context unavailable");
			return;
		}

		let angle = Date.now() * 0.001;
		const lightPos = vec3.fromValues(
			sin(angle) * 6.5,
			cos(angle) * 6.5 - 5,
			-3,
		);

		const boxShader = new Shader(gl, boxVert, boxFrag);
		const lightShader = new Shader(
			gl,
			boxVert,
			lightFrag,
		);

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
					textureLocationName: "material.diffuse",
				},
				{
					image: boxBorder,
					width: 500,
					height: 500,
					textureUnit: 1,
					textureLocationName:
						"material.specular",
				},
			],
			uniformsSetter(
				glInner: WebGL2RenderingContext,
				shaderInner: Shader,
			) {
				shaderInner.setVec3(
					localScene.camera.position,
					"cameraPos",
				);
				shaderInner.setVec3(
					localScene.camera.front,
					"light.direction",
				);
				shaderInner.setFloat(
					cos(pi / 18),
					"light.cutOff",
				);
				shaderInner.setFloat(
					cos(pi / 12),
					"light.outerCutOff",
				);
				shaderInner.setVec3(
					vec3.fromValues(0.3, 0.3, 0.3),
					"light.ambient",
				);
				shaderInner.setVec3(
					vec3.fromValues(0.9, 0.9, 0.9),
					"light.diffuse",
				);
				shaderInner.setVec3(
					vec3.fromValues(1, 1, 1),
					"light.specular",
				);
				shaderInner.setVec3(
					localScene.camera.position,
					"light.position",
				);
				shaderInner.setFloat(1.0, "light.constant");
				shaderInner.setFloat(0.045, "light.linear");
				shaderInner.setFloat(
					0.0075,
					"light.quadratic",
				);
				shaderInner.setVec3(
					vec3.fromValues(1.0, 0.5, 0.31),
					"material.ambient",
				);
				shaderInner.setFloat(
					64.0,
					"material.shininess",
				);
			},
		});

		const lightGeometry = new Geometry({
			shader: lightShader,
			attributes: attribute,
			vertexAttribPointer: boxVertexAttribPointer,
		});

		// create 10 random box instances (keeps original logic)
		new Array(10).fill(0).forEach(() => {
			const x = random(-5, 5, true);
			const y = random(-5, 5, true);
			const z = random(-10, 0, true);
			const instance = new GeometryInstance({
				geometry: boxGeometry,
				matrix: mat4.multiply(
					mat4.create(),
					mat4.fromTranslation(
						mat4.create(),
						vec3.fromValues(x, y, z),
					),
					mat4.fromScaling(
						mat4.create(),
						vec3.fromValues(1.5, 1.5, 1.5),
					),
				),
			});
			localScene.geometryMap.set(instance, instance);
		});

		const lightGeometryInstance = new GeometryInstance({
			geometry: lightGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(
					mat4.create(),
					lightPos,
				),
				mat4.fromScaling(
					mat4.create(),
					vec3.fromValues(0.1, 0.1, 0.1),
				),
			),
		});

		localScene.geometryMap.set(
			lightGeometryInstance,
			lightGeometryInstance,
		);

		// update light with setInterval as original
		const id = window.setInterval(() => {
			angle = Date.now() * 0.001;
			lightPos[1] = 0;
			lightPos[0] = cos(angle / 3) * 6.5;
			lightPos[2] = sin(angle / 3) * 6.5 - 5;
			lightGeometryInstance.matrix = mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(
					mat4.create(),
					lightPos,
				),
				mat4.fromScaling(
					mat4.create(),
					vec3.fromValues(0.1, 0.1, 0.1),
				),
			);
		}, 1);

		intervalRef.current = id;

		return () => {
			// cleanup interval & scene dispatch
			if (intervalRef.current != null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			try {
				localScene.dispatch?.();
			} catch (e) {
				console.log(e);
			} finally {
				sceneRef.current = null;
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
