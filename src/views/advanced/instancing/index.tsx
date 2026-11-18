import planetTextureImage from "@/assets/model/planet/planet_Quom1200.png";
import rockTextureImage from "@/assets/model/rock/Rock-Texture-Surface.jpg";
import {
	BlinnPhongMaterial,
	Camera,
	FPSControl,
	Geometry,
	GeometryInstance,
	InstancedBlinnPhongMaterial,
	InstancedGeometry,
	Material,
	PNTAttribPointer,
	Scene,
	Texture,
} from "@/helperv1";
import { Slider } from "antd";
import { mat4, vec3 } from "gl-matrix";
import { useEffect, useMemo, useRef, useState } from "react";
import { BufferGeometry, Group, Mesh, SphereGeometry, Vector3 } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** rock 实例数量 */
const ROCK_COUNT = 100000;
/** planet 缩放后的半径 */
const PLANET_RADIUS = 52;
/** 小行星带中心半径默认值 */
const RING_RADIUS = 190;
/** 轨道半径滑块下限（保持在 planet 外部） */
const RING_RADIUS_MIN = 90;
/** 轨道半径滑块上限 */
const RING_RADIUS_MAX = 380;
/** 小行星带径向半宽 */
const RING_HALF_WIDTH = 44;
/** 黄金角：任意前缀都能近似均匀铺满圆环 */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
/** 小行星带厚度默认值（总厚度） */
const RING_THICKNESS = 20;
/** 圆环厚度滑块上限 */
const RING_THICKNESS_MAX = 50;
/** rock 实例缩放下限 */
const ROCK_MIN_SCALE = 0.45;
/** rock 实例缩放上限 */
const ROCK_MAX_SCALE = 1.4;
/** 太阳半径 */
const SUN_RADIUS = 36;
/** obj 由 CopyWebpackPlugin 从 src/assets/data 原样拷贝到产物目录 */
const MODEL_BASE_PATH = "/assets/data/models";

/**
 * 读取 obj 文本
 */
async function loadObjText(filename: string): Promise<string> {
	const response = await fetch(`${MODEL_BASE_PATH}/${filename}`);
	if (!response.ok) throw new Error(`加载 ${filename} 失败：${response.status}`);
	return response.text();
}

interface BlinnPhongLight {
	ambient: vec3;
	diffuse: vec3;
	specular: vec3;
	shininess: number;
}

interface PntMeshData {
	attributes: Float32Array;
	indices: Uint32Array;
}

const PLANET_LIGHT: BlinnPhongLight = {
	ambient: vec3.fromValues(0.1, 0.1, 0.1),
	diffuse: vec3.fromValues(1.45, 1.45, 1.5),
	specular: vec3.fromValues(0.45, 0.45, 0.5),
	shininess: 48,
};

const ROCK_LIGHT: BlinnPhongLight = {
	ambient: vec3.fromValues(0.1, 0.1, 0.1),
	diffuse: vec3.fromValues(1.15, 1.15, 1.15),
	specular: vec3.fromValues(0.3, 0.3, 0.3),
	shininess: 24,
};

/** 自发光太阳：环境光拉满、漫反射和高光归零，输出纯白 */
const SUN_LIGHT: BlinnPhongLight = {
	ambient: vec3.fromValues(1, 1, 1),
	diffuse: vec3.fromValues(0, 0, 0),
	specular: vec3.fromValues(0, 0, 0),
	shininess: 1,
};

/**
 * 取出 obj 中的第一个 mesh
 */
function findMesh(group: Group): Mesh {
	let result: Mesh | undefined;
	group.traverse((child) => {
		if (!result && (child as Mesh).isMesh) result = child as Mesh;
	});
	if (!result) throw new Error("obj 文件中没有找到 mesh");
	return result;
}

/**
 * 把 three 的 BufferGeometry 转成 helperv1 使用的 PNT 交错数组
 *
 * - 合并重复顶点，减少实例化时的顶点处理量
 * - 以包围盒中心为原点，最长边缩放到 targetDiameter
 * - v 轴翻转，匹配未开启 UNPACK_FLIP_Y_WEBGL 的 Texture 上传方式
 */
function createPntData(source: BufferGeometry, targetDiameter: number): PntMeshData {
	const geometry = mergeVertices(source, 1e-4);
	if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
	const position = geometry.getAttribute("position");
	const normal = geometry.getAttribute("normal");
	const texCoord = geometry.getAttribute("uv");
	if (!position || !normal || !texCoord) {
		throw new Error("模型缺少 position / normal / uv 属性");
	}
	geometry.computeBoundingBox();
	const box = geometry.boundingBox;
	if (!box) throw new Error("无法计算模型包围盒");
	const center = new Vector3();
	const size = new Vector3();
	box.getCenter(center);
	box.getSize(size);
	const scale = targetDiameter / Math.max(size.x, size.y, size.z);
	const attributes = new Float32Array(position.count * 8);
	for (let index = 0; index < position.count; index += 1) {
		const offset = index * 8;
		attributes[offset] = (position.getX(index) - center.x) * scale;
		attributes[offset + 1] = (position.getY(index) - center.y) * scale;
		attributes[offset + 2] = (position.getZ(index) - center.z) * scale;
		attributes[offset + 3] = normal.getX(index);
		attributes[offset + 4] = normal.getY(index);
		attributes[offset + 5] = normal.getZ(index);
		attributes[offset + 6] = texCoord.getX(index);
		attributes[offset + 7] = 1 - texCoord.getY(index);
	}
	const indexAttribute = geometry.index;
	let indices: Uint32Array;
	if (indexAttribute) {
		indices = Uint32Array.from(indexAttribute.array as ArrayLike<number>);
	} else {
		indices = new Uint32Array(position.count);
		for (let index = 0; index < position.count; index += 1) indices[index] = index;
	}
	return { attributes, indices };
}

/**
 * 预计算 rock 的世界矩阵
 *
 * 角度按黄金角递增，任意数量的前缀都能近似均匀铺满圆环，滑块调整数量时已有 rock 不会跳动；
 * 半径、高度、旋转和缩放用固定种子随机，形成有厚度的小行星带，同时保证每次刷新分布一致。
 */
function createRockMatrices(count: number, ringRadius: number, ringThickness: number): mat4[] {
	const matrices = Array.from({ length: count }, () => mat4.create());
	const scale = vec3.create();
	let seed = 20261119;
	const random = () => {
		seed = (seed * 48271) % 2147483647;
		return seed / 2147483647;
	};
	for (let index = 0; index < matrices.length; index += 1) {
		const angle = index * GOLDEN_ANGLE;
		const radius = ringRadius + (random() - 0.5) * RING_HALF_WIDTH * 2;
		const matrix = matrices[index];
		mat4.identity(matrix);
		matrix[12] = Math.cos(angle) * radius;
		matrix[13] = Math.sin(angle) * radius;
		matrix[14] = (random() - 0.5) * ringThickness;
		mat4.rotateZ(matrix, matrix, random() * Math.PI * 2);
		mat4.rotateX(matrix, matrix, random() * Math.PI * 2);
		mat4.rotateY(matrix, matrix, random() * Math.PI * 2);
		const instanceScale = ROCK_MIN_SCALE + random() * (ROCK_MAX_SCALE - ROCK_MIN_SCALE);
		vec3.set(scale, instanceScale, instanceScale, instanceScale);
		mat4.scale(matrix, matrix, scale);
	}
	return matrices;
}

/**
 * 设置 Blinn-Phong 的光源与材质高光参数
 *
 * constant = 1、linear / quadratic = 0，用无衰减点光近似平行光。
 */
function setBlinnPhongLight(material: Material, light: BlinnPhongLight, position: vec3) {
	material.setVec3(light.ambient, "light.ambient");
	material.setVec3(light.diffuse, "light.diffuse");
	material.setVec3(light.specular, "light.specular");
	material.setVec3(position, "light.position");
	material.setFloat(1, "light.constant");
	material.setFloat(0, "light.linear");
	material.setFloat(0, "light.quadratic");
	material.setFloat(light.shininess, "material.shininess");
}

export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rockGeometryRef = useRef<InstancedGeometry | null>(null);
	const [rockCount, setRockCount] = useState(ROCK_COUNT);
	const [ringRadius, setRingRadius] = useState(RING_RADIUS);
	const [ringThickness, setRingThickness] = useState(RING_THICKNESS);
	const rockMatrices = useMemo(
		() => createRockMatrices(rockCount, ringRadius, ringThickness),
		[rockCount, ringRadius, ringThickness],
	);
	const rockMatricesRef = useRef(rockMatrices);

	useEffect(() => {
		rockMatricesRef.current = rockMatrices;
		if (rockGeometryRef.current) rockGeometryRef.current.modelMatrices = rockMatrices;
	}, [rockMatrices]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		// Z 轴朝上：小行星带位于 XY 平面，相机从 -Y 方向看向原点
		const sunPosition = vec3.fromValues(-225, -160, 140);
		const camera = new Camera({
			position: vec3.fromValues(0, -560, 225),
			front: vec3.normalize(vec3.create(), vec3.fromValues(0, 560, -225)),
			up: vec3.fromValues(0, 0, 1),
			far: 7000,
		});
		const scene = new Scene({
			canvas,
			control: new FPSControl({ camera, speed: 1 }),
		});

		const planetTexture = new Texture({ image: planetTextureImage });
		const rockTexture = new Texture({ image: rockTextureImage });
		let disposed = false;

		const buildScene = async () => {
			const [planetObjText, rockObjText] = await Promise.all([
				loadObjText("planet.obj"),
				loadObjText("rock.obj"),
			]);
			if (disposed) return;

			const planetMesh = findMesh(new OBJLoader().parse(planetObjText));
			const rockMesh = findMesh(new OBJLoader().parse(rockObjText));
			const planetData = createPntData(planetMesh.geometry, PLANET_RADIUS * 2);
			const rockData = createPntData(rockMesh.geometry, 2);
			const sunData = createPntData(new SphereGeometry(SUN_RADIUS, 48, 32), SUN_RADIUS * 2);

			const planetMaterial = new BlinnPhongMaterial({
				textures: [
					{ texture: planetTexture, unit: 0, name: "material.diffuse" },
					{ texture: planetTexture, unit: 1, name: "material.specular" },
				],
				uniformsSetter(...[, currentMaterial]) {
					setBlinnPhongLight(currentMaterial, PLANET_LIGHT, sunPosition);
				},
				culling: true,
			});
			const planetGeometry = new Geometry({
				attributes: planetData.attributes,
				indices: planetData.indices,
				vertexAttribPointer: PNTAttribPointer,
			});
			scene.add(new GeometryInstance({ geometry: planetGeometry, material: planetMaterial }));

			const rockMaterial = new InstancedBlinnPhongMaterial({
				textures: [
					{ texture: rockTexture, unit: 0, name: "material.diffuse" },
					{ texture: rockTexture, unit: 1, name: "material.specular" },
				],
				uniformsSetter(...[, currentMaterial]) {
					setBlinnPhongLight(currentMaterial, ROCK_LIGHT, sunPosition);
				},
				culling: true,
			});
			const rockGeometry = new InstancedGeometry({
				attributes: rockData.attributes,
				indices: rockData.indices,
				vertexAttribPointer: PNTAttribPointer,
				modelMatrices: rockMatricesRef.current,
			});
			rockGeometryRef.current = rockGeometry;
			scene.add(new GeometryInstance({ geometry: rockGeometry, material: rockMaterial }));

			const sunMaterial = new BlinnPhongMaterial({
				uniformsSetter(...[, currentMaterial]) {
					setBlinnPhongLight(currentMaterial, SUN_LIGHT, sunPosition);
				},
				culling: true,
			});
			const sunGeometry = new Geometry({
				attributes: sunData.attributes,
				indices: sunData.indices,
				vertexAttribPointer: PNTAttribPointer,
			});
			scene.add(
				new GeometryInstance({
					geometry: sunGeometry,
					material: sunMaterial,
					matrix: mat4.fromTranslation(mat4.create(), sunPosition),
				}),
			);
		};

		void buildScene().catch((error) => console.log(error));

		return () => {
			disposed = true;
			rockGeometryRef.current = null;
			try {
				scene.dispatch();
			} catch (error) {
				console.log(error);
			}
			planetTexture.remove();
			rockTexture.remove();
		};
	}, []);

	return (
		<div className="relative h-full w-full">
			<canvas ref={canvasRef} className="block h-full w-full" />
			<div className="absolute top-6 right-6 z-10 w-64 rounded-xl border border-white/10 bg-slate-900/80 p-4 text-slate-100 shadow-xl backdrop-blur">
				<div className="space-y-5">
					<div>
						<div className="mb-1 flex items-baseline justify-between">
							<span className="text-sm text-slate-300">Rock 数量</span>
							<span className="font-mono text-base">
								{rockCount.toLocaleString()}
							</span>
						</div>
						<Slider
							min={0}
							max={ROCK_COUNT}
							step={100}
							value={rockCount}
							onChange={setRockCount}
						/>
					</div>
					<div>
						<div className="mb-1 flex items-baseline justify-between">
							<span className="text-sm text-slate-300">轨道半径</span>
							<span className="font-mono text-base">{ringRadius}</span>
						</div>
						<Slider
							min={RING_RADIUS_MIN}
							max={RING_RADIUS_MAX}
							step={1}
							value={ringRadius}
							onChange={setRingRadius}
						/>
					</div>
					<div>
						<div className="mb-1 flex items-baseline justify-between">
							<span className="text-sm text-slate-300">圆环厚度</span>
							<span className="font-mono text-base">{ringThickness}</span>
						</div>
						<Slider
							min={0}
							max={RING_THICKNESS_MAX}
							step={1}
							value={ringThickness}
							onChange={setRingThickness}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
