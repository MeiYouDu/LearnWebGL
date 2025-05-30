import {
	defineComponent,
	onMounted,
	onUnmounted,
	ref,
	Ref,
} from "vue";
import { mat4, vec3, vec4 } from "gl-matrix";
import { Scene } from "../../helper/scene.ts";
import { Shader } from "../../helper/shader.ts";
import { Geometry } from "../../helper/geometry.ts";
import { GeometryInstance } from "../../helper/geometryInstance.ts";
import boxVert from "./box.vert";
import boxFrag from "./box.frag";
import lightFrag from "./light.frag";
import smile from "../../assets/image/awesomeface.png";
import box from "../../assets/image/container.jpg";
import { cos, sin } from "mathjs";

let scene: Scene;
const attribute = new Float32Array([
	-0.5, -0.5, -0.5, 0, 0, -1, 0, 0, 0.5, -0.5, -0.5, 0, 0,
	-1, 1, 0, 0.5, 0.5, -0.5, 0, 0, -1, 1, -1, 0.5, 0.5, -0.5,
	0, 0, -1, 1, -1, -0.5, 0.5, -0.5, 0, 0, -1, 0, -1, -0.5,
	-0.5, -0.5, 0, 0, -1, 0, 0, -0.5, -0.5, 0.5, 0, 0, 1, 0,
	0, 0.5, -0.5, 0.5, 0, 0, 1, 1, 0, 0.5, 0.5, 0.5, 0, 0, 1,
	1, -1, 0.5, 0.5, 0.5, 0, 0, 1, 1, -1, -0.5, 0.5, 0.5, 0,
	0, 1, 0, -1, -0.5, -0.5, 0.5, 0, 0, 1, 0, 0, -0.5, 0.5,
	0.5, -1, 0, 0, 1, 0, -0.5, 0.5, -0.5, -1, 0, 0, 1, -1,
	-0.5, -0.5, -0.5, -1, 0, 0, 0, -1, -0.5, -0.5, -0.5, -1,
	0, 0, 0, -1, -0.5, -0.5, 0.5, -1, 0, 0, 0, 0, -0.5, 0.5,
	0.5, -1, 0, 0, 1, 0, 0.5, 0.5, 0.5, 1, 0, 0, 1, 0, 0.5,
	0.5, -0.5, 1, 0, 0, 1, -1, 0.5, -0.5, -0.5, 1, 0, 0, 0,
	-1, 0.5, -0.5, -0.5, 1, 0, 0, 0, -1, 0.5, -0.5, 0.5, 1, 0,
	0, 0, 0, 0.5, 0.5, 0.5, 1, 0, 0, 1, 0, -0.5, -0.5, -0.5,
	0, -1, 0, 0, -1, 0.5, -0.5, -0.5, 0, -1, 0, 1, -1, 0.5,
	-0.5, 0.5, 0, -1, 0, 1, 0, 0.5, -0.5, 0.5, 0, -1, 0, 1, 0,
	-0.5, -0.5, 0.5, 0, -1, 0, 0, 0, -0.5, -0.5, -0.5, 0, -1,
	0, 0, -1, -0.5, 0.5, -0.5, 0, 1, 0, 0, -1, 0.5, 0.5, -0.5,
	0, 1, 0, 1, -1, 0.5, 0.5, 0.5, 0, 1, 0, 1, 0, 0.5, 0.5,
	0.5, 0, 1, 0, 1, 0, -0.5, 0.5, 0.5, 0, 1, 0, 0, 0, -0.5,
	0.5, -0.5, 0, 1, 0, 0, -1,
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

function main(
	instance: Ref<HTMLCanvasElement | undefined>,
) {
	onMounted(() => {
		if (!instance.value) return;
		scene = new Scene(instance.value);
		const gl = scene.gl.deref();
		if (!gl) return;
		let angle = new Date().getTime() * 0.001;
		const lightPos = vec3.fromValues(
			sin(angle) * 2,
			cos(angle) * 2,
			-3,
		);
		const boxShader = new Shader(gl, boxVert, boxFrag);
		const lightShader = new Shader(gl, boxVert, lightFrag);
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
					textureUnit: 0,
				},
			],
			uniformsSetter(
				gl: WebGL2RenderingContext,
				shader: Shader,
			) {
				shader.setVec4(
					vec4.fromValues(1, 1, 1, 1.0),
					"lightColor",
				);
				shader.setVec3(lightPos, "lightPos");
				shader.setVec3(scene.camera.position, "cameraPos");
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
				mat4.fromTranslation(mat4.create(), lightPos),
				mat4.fromScaling(
					mat4.create(),
					vec3.fromValues(0.1, 0.1, 0.1),
				),
			),
		});
		scene.geometryMap.set(
			boxGeometryInstance,
			boxGeometryInstance,
		);
		scene.geometryMap.set(
			lightGeometryInstance,
			lightGeometryInstance,
		);
		setInterval(() => {
			angle = new Date().getTime() * 0.001;
			lightPos[1] = 3;
			lightPos[0] = cos(angle) * 3;
			lightPos[2] = sin(angle) * 3;
			lightGeometryInstance.matrix = mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), lightPos),
				mat4.fromScaling(
					mat4.create(),
					vec3.fromValues(0.1, 0.1, 0.1),
				),
			);
		}, 16);
	});
	onUnmounted(() => {
		scene.dispatch();
	});
}

export default defineComponent({
	setup() {
		const canvasRef: Ref<HTMLCanvasElement | undefined> =
			ref();
		main(canvasRef);
		return function () {
			return <canvas ref={canvasRef}></canvas>;
		};
	},
});
