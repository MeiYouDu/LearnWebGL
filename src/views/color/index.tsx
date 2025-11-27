// BoxSceneReact.tsx
import { useEffect, useRef } from "react";
import { mat4, vec3, vec4 } from "gl-matrix";
import { cos, sin } from "mathjs";
import { Scene } from "../../helper/scene";
import { Shader } from "../../helper/shader";
import { Geometry } from "../../helper/geometry";
import { GeometryInstance } from "../../helper/geometryInstance";
import boxVert from "./box.vert";
import boxFrag from "./box.frag";
import lightFrag from "./light.frag";
import smile from "../../assets/image/awesomeface.png";
import box from "../../assets/image/container.jpg";

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

// helper: safe gl extraction (scene.gl is expected to be a WeakRef or similar)
function getGLFromScene(
	scene: Scene,
): WebGL2RenderingContext | null {
	const maybe = (
		scene as unknown as {
			gl?: {
				deref?: () => WebGL2RenderingContext | null;
			};
		}
	).gl;
	if (!maybe) return null;
	if (typeof maybe.deref === "function") {
		try {
			return maybe.deref() ?? null;
		} catch {
			return null;
		}
	}
	return null;
}

export default function BoxSceneReact() {
	const canvasRef = useRef<HTMLCanvasElement | null>(
		null,
	);
	const sceneRef = useRef<Scene | null>(null);
	const intervalRef = useRef<number | null>(null);

	useEffect(() => {
		let scene: Scene | null = null;
		const canvas = canvasRef.current;
		if (!canvas) return;

		scene = new Scene(canvas);
		sceneRef.current = scene;

		const gl = getGLFromScene(scene);
		if (!gl) {
			console.error("webgl2 context unavailable");
			return;
		}

		let angle = Date.now() * 0.001;
		const lightPos = vec3.fromValues(
			sin(angle) * 2,
			cos(angle) * 2,
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
				},
				{
					image: smile,
					width: 476,
					height: 476,
					textureUnit: 1,
				},
			],
			uniformsSetter(
				glInner: WebGL2RenderingContext,
				shaderInner: Shader,
			) {
				shaderInner.setVec4(
					vec4.fromValues(1, 1, 1, 1.0),
					"lightColor",
				);
				shaderInner.setVec3(lightPos, "lightPos");
				shaderInner.setVec3(
					(scene as Scene).camera.position,
					"cameraPos",
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
				mat4.fromTranslation(
					mat4.create(),
					vec3.fromValues(0, 0, 0),
				),
				mat4.fromScaling(
					mat4.create(),
					vec3.fromValues(1.5, 1.5, 1.5),
				),
			),
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

		// register into scene
		(scene as Scene).geometryMap.set(
			boxGeometryInstance,
			boxGeometryInstance,
		);
		(scene as Scene).geometryMap.set(
			lightGeometryInstance,
			lightGeometryInstance,
		);

		// keep original setInterval behaviour (1ms)
		const id = window.setInterval(() => {
			angle = Date.now() * 0.001;
			lightPos[1] = 3;
			lightPos[0] = cos(angle) * 3;
			lightPos[2] = sin(angle) * 3;
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
			if (intervalRef.current != null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			try {
				scene?.dispatch();
			} catch {
				// ignore
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
