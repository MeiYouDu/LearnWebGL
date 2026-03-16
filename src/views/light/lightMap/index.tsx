// BoxScene.tsx
import { useEffect, useRef } from "react";
import { mat4, vec3 } from "gl-matrix";
import { Scene } from "@/helper/scene";
import { Shader } from "@/helper/shader";
import { Geometry } from "@/helper/geometry";
import { GeometryInstance } from "@/helper/geometryInstance";
import boxVert from "./box.vert";
import boxFrag from "./box.frag";
import lightFrag from "./light.frag";
import boxBorder from "../../../assets/textures/container2_specular.png";
import box from "../../../assets/textures/container2.png";
import code from "../../../assets/textures/matrix.jpg";

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

export default function BoxScene() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);
	const intervalRef = useRef<number | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const scene = new Scene(canvas);
		sceneRef.current = scene;

		const gl = scene.gl.deref();

		if (!gl) {
			console.error("WebGL2 context unavailable");
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
					textureLocationName: "material.diffuse",
				},
				{
					image: boxBorder,
					width: 500,
					height: 500,
					textureUnit: 1,
					textureLocationName: "material.specular",
				},
				{
					image: code,
					width: 512,
					height: 512,
					textureUnit: 2,
					textureLocationName: "code",
				},
			],
			uniformsSetter(glInner: WebGL2RenderingContext, shaderInner: Shader) {
				// assume scene.camera.position exists
				shaderInner.setVec3(scene.camera.position, "cameraPos");
				shaderInner.setVec3(vec3.fromValues(0.5, 0.5, 0.5), "light.ambient");
				shaderInner.setVec3(vec3.fromValues(0.8, 0.8, 0.8), "light.diffuse");
				shaderInner.setVec3(vec3.fromValues(1, 1, 1), "light.specular");
				shaderInner.setVec3(lightPos, "light.position");
				shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.ambient");
				shaderInner.setFloat(64.0, "material.shininess");
				// keep original weird timestamp-based cos
				shaderInner.setFloat(
					Number(new Date().getTime().toString().slice(9)) * 0.005,
					"time",
				);
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

		// register instances to scene
		scene.geometryMap.set(boxGeometryInstance, boxGeometryInstance);
		scene.geometryMap.set(lightGeometryInstance, lightGeometryInstance);

		// keep updating light position with setInterval (as requested)
		const id = window.setInterval(() => {
			angle = Date.now() * 0.001;
			lightPos[1] = 0; // original code forced y = 3
			lightPos[0] = Math.cos(angle) * 3;
			lightPos[2] = Math.sin(angle) * 3;

			lightGeometryInstance.matrix = mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), lightPos),
				mat4.fromScaling(mat4.create(), vec3.fromValues(0.1, 0.1, 0.1)),
			);
		}, 1);

		intervalRef.current = id;

		// cleanup
		return () => {
			if (intervalRef.current != null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			try {
				sceneRef.current?.dispatch?.();
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
