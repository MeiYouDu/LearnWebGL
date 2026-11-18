import containerImage from "@/assets/image/container.jpg";
import {
	Camera,
	FPSControl,
	GeometryInstance,
	InstancedBlinnPhongMaterial,
	InstancedGeometry,
	PNTAttribPointer,
	Scene,
	Texture,
} from "@/helperv1";
import { mat4, vec3 } from "gl-matrix";
import { useEffect, useRef } from "react";

const GRID_SIZE = 10;
const GRID_SPACING = 2.4;
const CUBE_SCALE = 1.5;
const INSTANCE_COUNT = GRID_SIZE * GRID_SIZE;

type Vec3Tuple = [number, number, number];

interface CubeFace {
	normal: Vec3Tuple;
	/** 面内水平方向，对应 UV 的 u */
	u: Vec3Tuple;
	/** 面内垂直方向，对应 UV 的 v */
	v: Vec3Tuple;
}

// 每个面满足 u × v = normal；四角按 BL/BR/TR/TL 生成，从面外侧看为逆时针
const CUBE_FACES: CubeFace[] = [
	{ normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
	{ normal: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
	{ normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
	{ normal: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
	{ normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
	{ normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
];

const CORNER_SIGNS: Array<[number, number]> = [
	[-1, -1],
	[1, -1],
	[1, 1],
	[-1, 1],
];
const CORNER_UVS: Array<[number, number]> = [
	[0, 0],
	[1, 0],
	[1, 1],
	[0, 1],
];

/**
 * 生成 24 顶点 / 36 索引的立方体，PNT 交错，stride = 8
 */
function createCubePNT(): { attributes: Float32Array; indices: Uint32Array } {
	const attributes = new Float32Array(24 * 8);
	const indices = new Uint32Array(36);
	let vertexOffset = 0;
	let indexOffset = 0;
	CUBE_FACES.forEach(({ normal, u, v }) => {
		CORNER_SIGNS.forEach(([signU, signV], corner) => {
			const offset = (vertexOffset + corner) * 8;
			attributes[offset] = normal[0] * 0.5 + u[0] * signU * 0.5 + v[0] * signV * 0.5;
			attributes[offset + 1] = normal[1] * 0.5 + u[1] * signU * 0.5 + v[1] * signV * 0.5;
			attributes[offset + 2] = normal[2] * 0.5 + u[2] * signU * 0.5 + v[2] * signV * 0.5;
			attributes[offset + 3] = normal[0];
			attributes[offset + 4] = normal[1];
			attributes[offset + 5] = normal[2];
			attributes[offset + 6] = CORNER_UVS[corner][0];
			attributes[offset + 7] = CORNER_UVS[corner][1];
		});
		indices[indexOffset] = vertexOffset;
		indices[indexOffset + 1] = vertexOffset + 1;
		indices[indexOffset + 2] = vertexOffset + 2;
		indices[indexOffset + 3] = vertexOffset;
		indices[indexOffset + 4] = vertexOffset + 2;
		indices[indexOffset + 5] = vertexOffset + 3;
		vertexOffset += 4;
		indexOffset += 6;
	});
	return { attributes, indices };
}

/**
 * 更新每个实例的世界矩阵：平移到网格位置，绕自身 Z 轴旋转，再整体缩放
 */
function updateModelMatrices(modelMatrices: mat4[], time: number): void {
	const half = (GRID_SIZE - 1) / 2;
	for (let row = 0; row < GRID_SIZE; row += 1) {
		for (let column = 0; column < GRID_SIZE; column += 1) {
			const matrix = modelMatrices[row * GRID_SIZE + column];
			mat4.identity(matrix);
			mat4.translate(matrix, matrix, [
				(column - half) * GRID_SPACING,
				(row - half) * GRID_SPACING,
				0,
			]);
			mat4.rotateZ(matrix, matrix, time * 0.6 + (row + column) * 0.35);
			mat4.scale(matrix, matrix, [CUBE_SCALE, CUBE_SCALE, CUBE_SCALE]);
		}
	}
}

export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		// 网格在 XY 平面、Z 轴朝上；相机从 -Y 方向看向原点
		const camera = new Camera({
			position: vec3.fromValues(0, -28, 16),
			front: vec3.normalize(vec3.create(), vec3.fromValues(0, 28, -16)),
			up: vec3.fromValues(0, 0, 1),
		});
		const scene = new Scene({
			canvas,
			control: new FPSControl({ camera, speed: 0.1 }),
		});
		const cube = createCubePNT();
		const modelMatrices = Array.from({ length: INSTANCE_COUNT }, () => mat4.create());
		updateModelMatrices(modelMatrices, 0);
		const geometry = new InstancedGeometry({
			attributes: cube.attributes,
			indices: cube.indices,
			vertexAttribPointer: PNTAttribPointer,
			modelMatrices,
		});
		const diffuseTexture = new Texture({ image: containerImage });
		const specularTexture = new Texture({ image: containerImage });
		const lightPosition = vec3.fromValues(0, -10, 26);
		const material = new InstancedBlinnPhongMaterial({
			textures: [
				{ texture: diffuseTexture, unit: 0, name: "material.diffuse" },
				{ texture: specularTexture, unit: 1, name: "material.specular" },
			],
			uniformsSetter(...[, currentMaterial]) {
				currentMaterial.setVec3(vec3.fromValues(0.45, 0.47, 0.5), "light.ambient");
				currentMaterial.setVec3(vec3.fromValues(1, 1, 1), "light.diffuse");
				currentMaterial.setVec3(vec3.fromValues(1, 1, 1), "light.specular");
				currentMaterial.setVec3(lightPosition, "light.position");
				currentMaterial.setFloat(1, "light.constant");
				currentMaterial.setFloat(0.007, "light.linear");
				currentMaterial.setFloat(0.0002, "light.quadratic");
				currentMaterial.setFloat(64, "material.shininess");
			},
			culling: true,
		});
		scene.add(new GeometryInstance({ geometry, material }));
		const startTime = performance.now();
		const interval = window.setInterval(() => {
			updateModelMatrices(modelMatrices, (performance.now() - startTime) / 1000);
		}, 16);
		return () => {
			window.clearInterval(interval);
			try {
				scene.dispatch();
			} catch (error) {
				console.log(error);
			}
			diffuseTexture.remove();
			specularTexture.remove();
		};
	}, []);

	return (
		<div className="relative h-full w-full">
			<canvas ref={canvasRef} className="block h-full w-full" />
		</div>
	);
}
