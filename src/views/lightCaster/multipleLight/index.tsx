import {
	defineComponent,
	onMounted,
	onUnmounted,
	ref,
	Ref,
} from "vue";
import { cos, pi, sin } from "mathjs";
import { mat4, vec3 } from "gl-matrix";
import { random } from "lodash";
import { Scene } from "../../../helper/scene.ts";
import { Shader } from "../../../helper/shader.ts";
import { Geometry } from "../../../helper/geometry.ts";
import { GeometryInstance } from "../../../helper/geometryInstance.ts";
import boxVert from "./box.vert";
import boxFrag from "./box.frag";
import lightFrag from "./light.frag";
import boxBorder from "../../../assets/textures/container2_specular.png";
import box from "../../../assets/textures/container2.png";

interface Light {
	position: vec3;
	ambient: vec3;
	diffuse: vec3;
	specular: vec3;
	constant: number;
	linear: number;
	quadratic: number;
}
interface Material {
	shininess: number;
}

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
	let scene: Scene;
	onMounted(() => {
		if (!instance.value) return;
		scene = new Scene(instance.value);
		const gl = scene.gl.deref();
		if (!gl) return;
		let angle = new Date().getTime() * 0.001;
		const lightPositions: vec3[] = new Array(4)
			.fill(0)
			.map((...[, index]) => {
				return vec3.fromValues(
					sin(angle / 3 + index) * 6.5,
					sin(angle / 3 + index) * 6.5,
					cos(angle / 3 + index) * 6.5 - 5,
				);
			});
		const boxShader = new Shader(gl, boxVert, boxFrag);
		const lightShader = new Shader(gl, boxVert, lightFrag);
		const ambient = vec3.fromValues(0.2, 0.2, 0.2);
		const diffuse = vec3.fromValues(0.6, 0.6, 0.6);
		const specular = vec3.fromValues(1.0, 1.0, 1.0);
		const flashLightDiffuse = vec3.fromValues(
			0.8,
			0.8,
			0.8,
		);
		const pointLightDiffuse = vec3.fromValues(
			0.9,
			0.9,
			0.9,
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
					textureLocationName: "material.specular",
				},
			],
			uniformsSetter(
				gl: WebGL2RenderingContext,
				shader: Shader,
			) {
				shader.setVec3(
					scene.camera.position,
					"camera.position",
				);
				shader.setFloat(64.0, "material.shininess");
				shader.setVec3(
					vec3.fromValues(0, -1, 0),
					"parallelLight.direction",
				);
				shader.setVec3(ambient, "parallelLight.ambient");
				shader.setVec3(diffuse, "parallelLight.diffuse");
				shader.setVec3(specular, "parallelLight.specular");
				shader.setVec3(
					scene.camera.position,
					"flashLight.position",
				);
				shader.setVec3(
					scene.camera.front,
					"flashLight.direction",
				);
				shader.setFloat(cos(pi / 18), "flashLight.cutOff");
				shader.setFloat(
					cos(pi / 16),
					"flashLight.outerCutOff",
				);
				shader.setVec3(ambient, "flashLight.ambient");
				shader.setVec3(
					flashLightDiffuse,
					"flashLight.diffuse",
				);
				shader.setVec3(specular, "flashLight.specular");
				shader.setFloat(1.0, "flashLight.constant");
				shader.setFloat(0.022, "flashLight.linear");
				shader.setFloat(0.0019, "flashLight.quadratic");
				lightPositions.forEach((item, index) => {
					shader.setVec3(
						item,
						`pointLights[${index}].position`,
					);
					shader.setVec3(
						ambient,
						`pointLights[${index}].ambient`,
					);
					shader.setVec3(
						pointLightDiffuse,
						`pointLights[${index}].diffuse`,
					);
					shader.setVec3(
						specular,
						`pointLights[${index}].specular`,
					);
					shader.setFloat(
						1.0,
						`pointLights[${index}].constant`,
					);
					shader.setFloat(
						0.022,
						`pointLights[${index}].linear`,
					);
					shader.setFloat(
						0.0019,
						`pointLights[${index}].quadratic`,
					);
				});
			},
		});
		const lightGeometry = new Geometry({
			shader: lightShader,
			attributes: attribute,
			vertexAttribPointer: boxVertexAttribPointer,
		});
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
			scene.geometryMap.set(instance, instance);
		});
		const arr: GeometryInstance[] = [];
		for (let i = 0, u = lightPositions.length; i < u; i++) {
			const lightGeometryInstance = new GeometryInstance({
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
			scene.geometryMap.set(
				lightGeometryInstance,
				lightGeometryInstance,
			);
			arr.push(lightGeometryInstance);
		}
		setInterval(() => {
			angle = new Date().getTime() * 0.001;
			arr.forEach((item, index) => {
				lightPositions[index][0] =
					cos(angle / 3 + index) * 6.5;
				// lightPositions[index][1] =
				// 	sin(angle / 3 + index) * 6.5;
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
