import {
	defineComponent,
	onMounted,
	onUnmounted,
	ref,
	Ref,
} from "vue";
import { Scene } from "../../helper/scene.ts";
import { Shader } from "../../helper/shader.ts";
import boxVert from "./box.vert";
import boxFrag from "./box.frag";
import lightFrag from "./light.frag";
import { Geometry } from "../../helper/geometry.ts";
import { GeometryInstance } from "../../helper/geometryInstance.ts";
import { mat4, vec3 } from "gl-matrix";
import smile from "../../assets/image/awesomeface.png";
import box from "../../assets/image/container.jpg";

let scene: Scene;
const attribute = new Float32Array([
	-0.5, -0.5, -0.5, 0.0, 0.0, 0.5, -0.5, -0.5, 1.0, 0.0,
	0.5, 0.5, -0.5, 1.0, 1.0, 0.5, 0.5, -0.5, 1.0, 1.0, -0.5,
	0.5, -0.5, 0.0, 1.0, -0.5, -0.5, -0.5, 0.0, 0.0, -0.5,
	-0.5, 0.5, 0.0, 0.0, 0.5, -0.5, 0.5, 1.0, 0.0, 0.5, 0.5,
	0.5, 1.0, 1.0, 0.5, 0.5, 0.5, 1.0, 1.0, -0.5, 0.5, 0.5,
	0.0, 1.0, -0.5, -0.5, 0.5, 0.0, 0.0, -0.5, 0.5, 0.5, 1.0,
	0.0, -0.5, 0.5, -0.5, 1.0, 1.0, -0.5, -0.5, -0.5, 0.0,
	1.0, -0.5, -0.5, -0.5, 0.0, 1.0, -0.5, -0.5, 0.5, 0.0,
	0.0, -0.5, 0.5, 0.5, 1.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.0,
	0.5, 0.5, -0.5, 1.0, 1.0, 0.5, -0.5, -0.5, 0.0, 1.0, 0.5,
	-0.5, -0.5, 0.0, 1.0, 0.5, -0.5, 0.5, 0.0, 0.0, 0.5, 0.5,
	0.5, 1.0, 0.0, -0.5, -0.5, -0.5, 0.0, 1.0, 0.5, -0.5,
	-0.5, 1.0, 1.0, 0.5, -0.5, 0.5, 1.0, 0.0, 0.5, -0.5, 0.5,
	1.0, 0.0, -0.5, -0.5, 0.5, 0.0, 0.0, -0.5, -0.5, -0.5,
	0.0, 1.0, -0.5, 0.5, -0.5, 0.0, 1.0, 0.5, 0.5, -0.5, 1.0,
	1.0, 0.5, 0.5, 0.5, 1.0, 0.0, 0.5, 0.5, 0.5, 1.0, 0.0,
	-0.5, 0.5, 0.5, 0.0, 0.0, -0.5, 0.5, -0.5, 0.0, 1.0,
]);
for (let i = 0, u = attribute.length; i < u; i += 5) {
	attribute[i + 4] = -attribute[i + 4];
}

function main(
	instance: Ref<HTMLCanvasElement | undefined>,
) {
	onMounted(() => {
		if (!instance.value) return;
		scene = new Scene(instance.value);
		const gl = scene.gl.deref();
		if (!gl) return;
		const boxShader = new Shader(gl, boxVert, boxFrag);
		const lightShader = new Shader(gl, boxVert, lightFrag);
		function boxVertexAttribPointer(
			gl: WebGL2RenderingContext,
			shader: Shader,
		): number {
			const stride = 5;
			const positionAttrLocation =
				shader.getAttribLocation("position");
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
					4 * stride,
					0,
				);
				gl.enableVertexAttribArray(positionAttrLocation);
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
					4 * stride,
					4 * 3,
				);
				gl.enableVertexAttribArray(texCoordAttrLocation);
			}
			return stride;
		}
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
		});
		// const lightGeometry = new Geometry({
		// 	shader: lightShader,
		// 	attributes:attribute,
		// 	vertexAttribPointer: boxVertexAttribPointer,
		// });
		const boxGeometryInstance = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.fromTranslation(
				mat4.create(),
				vec3.fromValues(1, 0, -3),
			),
		});
		// const lightGeometryInstance = new GeometryInstance({
		// 	geometry: lightGeometry,
		// 	matrix: mat4.fromTranslation(
		// 		mat4.create(),
		// 		vec3.fromValues(2, 2, 5),
		// 	),
		// });
		scene.geometryMap.set(
			boxGeometryInstance,
			boxGeometryInstance,
		);
		// scene.geometryMap.set(
		// 	lightGeometryInstance,
		// 	lightGeometryInstance,
		// );
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
