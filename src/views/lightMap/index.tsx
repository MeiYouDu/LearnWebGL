import {
	defineComponent,
	onMounted,
	onUnmounted,
	ref,
	Ref,
} from "vue";
import { mat4, vec3 } from "gl-matrix";
import { Scene } from "../../helper/scene.ts";
import { Shader } from "../../helper/shader.ts";
import { Geometry } from "../../helper/geometry.ts";
import { GeometryInstance } from "../../helper/geometryInstance.ts";
import boxVert from "./box.vert";
import boxFrag from "./box.frag";
import lightFrag from "./light.frag";
import boxBorder from "../../assets/textures/container2_specular.png";
import box from "../../assets/textures/container2.png";
import code from "../../assets/textures/matrix.jpg";
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
			uniformsSetter(
				gl: WebGL2RenderingContext,
				shader: Shader,
			) {
				shader.setVec3(scene.camera.position, "cameraPos");
				shader.setVec3(
					vec3.fromValues(0.1, 0.1, 0.1),
					"light.ambient",
				);
				shader.setVec3(
					vec3.fromValues(0.8, 0.8, 0.8),
					"light.diffuse",
				);
				shader.setVec3(
					vec3.fromValues(1, 1, 1),
					"light.specular",
				);
				shader.setVec3(lightPos, "light.position");
				shader.setVec3(
					vec3.fromValues(1.0, 0.5, 0.31),
					"material.ambient",
				);
				// shader.setVec3(
				// 	vec3.fromValues(1.0, 0.5, 0.31),
				// 	"material.diffuse",
				// );
				// shader.setVec3(
				// 	vec3.fromValues(0.5, 0.5, 0.5),
				// 	"material.specular",
				// );
				shader.setFloat(64.0, "material.shininess");
				shader.setFloat(cos(new Date().getTime()), "time");
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
