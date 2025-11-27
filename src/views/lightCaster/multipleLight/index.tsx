// BoxSceneReact.tsx
import { useEffect, useRef } from "react";
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
import awesome from "../../../assets/textures/awesomeface.png";

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
		const canvas = canvasRef.current;
		if (!canvas) return;

		// create Scene (same as Vue)
		const scene = new Scene(canvas);
		sceneRef.current = scene;

		// per your instruction: use scene.gl.deref()
		// safe access without `any`
		const maybeGL = (
			scene as unknown as {
				gl?: {
					deref?: () => WebGL2RenderingContext | null;
				};
			}
		).gl;
		const gl = maybeGL?.deref ? maybeGL.deref() : null;
		if (!gl) {
			console.error("webgl2 context unavailable");
			return;
		}

		let angle = Date.now() * 0.001;
		const lightPositions: vec3[] = new Array(4)
			.fill(0)
			.map((_, index) =>
				vec3.fromValues(
					sin(angle / 3 + index) * 6.5,
					sin(angle / 3 + index) * 6.5,
					cos(angle / 3 + index) * 6.5 - 5,
				),
			);

		const boxShader = new Shader(gl, boxVert, boxFrag);
		const lightShader = new Shader(
			gl,
			boxVert,
			lightFrag,
		);

		const ambient = vec3.fromValues(0.2, 0.2, 0.2);
		const diffuse = vec3.fromValues(0.6, 0.6, 0.6);
		const specular = vec3.fromValues(1.0, 1.0, 1.0);
		const flashLightDiffuse = vec3.fromValues(
			0.9,
			0.9,
			0.9,
		);
		const pointLightDiffuse = vec3.fromValues(
			0.8,
			0.8,
			0.8,
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
				{
					image: awesome,
					width: 476,
					height: 476,
					textureUnit: 2,
					textureLocationName: "awesome",
				},
			],
			uniformsSetter(
				glInner: WebGL2RenderingContext,
				shaderInner: Shader,
			) {
				shaderInner.setVec3(
					(scene as Scene).camera.position,
					"camera.position",
				);
				shaderInner.setFloat(
					64.0,
					"material.shininess",
				);
				shaderInner.setVec3(
					vec3.fromValues(0, -1, 0),
					"parallelLight.direction",
				);
				shaderInner.setVec3(
					ambient,
					"parallelLight.ambient",
				);
				shaderInner.setVec3(
					diffuse,
					"parallelLight.diffuse",
				);
				shaderInner.setVec3(
					specular,
					"parallelLight.specular",
				);

				shaderInner.setVec3(
					(scene as Scene).camera.position,
					"flashLight.position",
				);
				shaderInner.setVec3(
					(scene as Scene).camera.front,
					"flashLight.direction",
				);
				shaderInner.setFloat(
					cos(pi / 18),
					"flashLight.cutOff",
				);
				shaderInner.setFloat(
					cos(pi / 16),
					"flashLight.outerCutOff",
				);
				shaderInner.setVec3(
					ambient,
					"flashLight.ambient",
				);
				shaderInner.setVec3(
					flashLightDiffuse,
					"flashLight.diffuse",
				);
				shaderInner.setVec3(
					specular,
					"flashLight.specular",
				);
				shaderInner.setFloat(
					1.0,
					"flashLight.constant",
				);
				shaderInner.setFloat(
					0.022,
					"flashLight.linear",
				);
				shaderInner.setFloat(
					0.0019,
					"flashLight.quadratic",
				);

				lightPositions.forEach((p, idx) => {
					shaderInner.setVec3(
						p,
						`pointLights[${idx}].position`,
					);
					shaderInner.setVec3(
						ambient,
						`pointLights[${idx}].ambient`,
					);
					shaderInner.setVec3(
						pointLightDiffuse,
						`pointLights[${idx}].diffuse`,
					);
					shaderInner.setVec3(
						specular,
						`pointLights[${idx}].specular`,
					);
					shaderInner.setFloat(
						1.0,
						`pointLights[${idx}].constant`,
					);
					shaderInner.setFloat(
						0.022,
						`pointLights[${idx}].linear`,
					);
					shaderInner.setFloat(
						0.0019,
						`pointLights[${idx}].quadratic`,
					);
				});
			},
		});

		const lightGeometry = new Geometry({
			shader: lightShader,
			attributes: attribute,
			vertexAttribPointer: boxVertexAttribPointer,
		});

		// create 10 random box instances (same behaviour)
		for (let i = 0; i < 10; i++) {
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
			(scene as Scene).geometryMap.set(
				instance,
				instance,
			);
		}

		const arr: GeometryInstance[] = [];
		for (let i = 0; i < lightPositions.length; i++) {
			const lightGeometryInstance =
				new GeometryInstance({
					geometry: lightGeometry,
					matrix: mat4.multiply(
						mat4.create(),
						mat4.fromTranslation(
							mat4.create(),
							lightPositions[i],
						),
						mat4.fromScaling(
							mat4.create(),
							vec3.fromValues(0.1, 0.1, 0.1),
						),
					),
				});
			(scene as Scene).geometryMap.set(
				lightGeometryInstance,
				lightGeometryInstance,
			);
			arr.push(lightGeometryInstance);
		}

		// setInterval update (kept as original 1ms)
		const id = window.setInterval(() => {
			angle = Date.now() * 0.001;
			arr.forEach((item, index) => {
				lightPositions[index][0] =
					cos(angle / 3 + index) * 6.5;
				// lightPositions[index][1] = sin(angle / 3 + index) * 6.5;
				lightPositions[index][2] =
					sin(angle / 3 + index) * 6.5 - 5;
				item.matrix = mat4.multiply(
					mat4.create(),
					mat4.fromTranslation(
						mat4.create(),
						lightPositions[index],
					),
					mat4.fromScaling(
						mat4.create(),
						vec3.fromValues(0.1, 0.1, 0.1),
					),
				);
			});
		}, 1);

		intervalRef.current = id;

		// save scene ref for potential external usage / cleanup
		sceneRef.current = scene;

		return () => {
			if (intervalRef.current != null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			try {
				scene.dispatch();
			} catch {
				// ignore cleanup errors
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
