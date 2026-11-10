// 法线可视化工具 demo：把球体每个顶点的法线画成线段
import {
	BlinnPhongMaterial,
	Camera,
	createNormalVisualization,
	FPSControl,
	Geometry,
	GeometryInstance,
	LineMaterial,
	PNTAttribPointer,
	Scene,
} from "@/helperv1";
import { Slider, Switch } from "antd";
import { mat4, vec3 } from "gl-matrix";
import { useEffect, useRef, useState } from "react";
import { createSpherePNT } from "./geometry";

// 球体与光照参数
const SPHERE_RADIUS = 1.4;
const LIGHT_POSITION = vec3.fromValues(4, 5, 6);
// 法线线段整体外扩一点，避免起点与球面共面产生 z-fighting
const LINE_MATRIX = mat4.fromScaling(mat4.create(), vec3.fromValues(1.004, 1.004, 1.004));

// 工具的参数：stride 8 / normal 偏移 3 对应 PNT 球体
const SPHERE_STRIDE = 8;
const SPHERE_NORMAL_OFFSET = 3;

interface NormalSettings {
	length: number;
	step: number;
	normalColor: boolean;
}

/**
 * 创建法线线段实例并注册到场景。
 * LineMaterial 每次重建都会编译一份 shader，因此只在实例不存在时创建；
 * 之后调整长度 / 步长只替换 geometry（见组件内的重建逻辑）。
 */
function addNormalInstance(scene: Scene, source: Geometry, settings: NormalSettings) {
	const geometry = createNormalVisualization(source, {
		stride: SPHERE_STRIDE,
		positionOffset: 0,
		normalOffset: SPHERE_NORMAL_OFFSET,
		length: settings.length,
		step: settings.step,
	});
	const instance = new GeometryInstance({
		geometry,
		material: new LineMaterial({ normalColor: settings.normalColor }),
		matrix: LINE_MATRIX,
	});
	scene.add(instance);
	return instance;
}

export default function NormalVisualizationDemo() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);
	const sphereGeometryRef = useRef<Geometry | null>(null);
	const normalInstanceRef = useRef<GeometryInstance | null>(null);

	const [showNormals, setShowNormals] = useState(true);
	const [normalColor, setNormalColor] = useState(true);
	const [length, setLength] = useState(0.3);
	const [step, setStep] = useState(2);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const camera = new Camera({
			position: vec3.fromValues(0, 0, 5),
			front: vec3.fromValues(0, 0, -1),
		});
		const scene = new Scene({
			canvas,
			control: new FPSControl({ camera, speed: 0.1 }),
		});
		sceneRef.current = scene;

		// 球体：PNT 交错数组，normal 偏移 3
		const sphereData = createSpherePNT({
			radius: SPHERE_RADIUS,
			widthSegments: 32,
			heightSegments: 16,
		});
		const sphereGeometry = new Geometry({
			attributes: sphereData.attributes,
			indices: sphereData.indices,
			vertexAttribPointer: PNTAttribPointer,
		});
		sphereGeometryRef.current = sphereGeometry;

		// 灰色球体 + 点光源：只提供位置/颜色，diffuse、specular 由材质自动绑 1×1 白纹理
		const sphereMaterial = new BlinnPhongMaterial({
			uniformsSetter(...[, material]) {
				material.setVec3(LIGHT_POSITION, "light.position");
				material.setVec3(vec3.fromValues(0.16, 0.18, 0.22), "light.ambient");
				material.setVec3(vec3.fromValues(0.62, 0.64, 0.68), "light.diffuse");
				material.setVec3(vec3.fromValues(0.45, 0.45, 0.45), "light.specular");
				material.setFloat(1, "light.constant");
				material.setFloat(0.027, "light.linear");
				material.setFloat(0.0028, "light.quadratic");
				material.setFloat(96, "material.shininess");
			},
		});
		scene.add(new GeometryInstance({ geometry: sphereGeometry, material: sphereMaterial }));

		return () => {
			normalInstanceRef.current = null;
			sphereGeometryRef.current = null;
			try {
				scene.dispatch();
			} catch (e) {
				console.log(e);
			} finally {
				sceneRef.current = null;
			}
		};
	}, []);

	// 开关 / 参数变化：复用 LineMaterial，只重建线段几何体
	useEffect(() => {
		const scene = sceneRef.current;
		const source = sphereGeometryRef.current;
		if (!scene || !source) return;

		if (!showNormals) {
			if (normalInstanceRef.current) {
				scene.remove(normalInstanceRef.current);
				normalInstanceRef.current = null;
			}
			return;
		}

		if (!normalInstanceRef.current) {
			normalInstanceRef.current = addNormalInstance(scene, source, {
				length,
				step,
				normalColor,
			});
			return;
		}

		const instance = normalInstanceRef.current;
		if (instance.material instanceof LineMaterial) {
			instance.material.normalColor = normalColor;
		}
		const previous = instance.geometry;
		const next = createNormalVisualization(source, {
			stride: SPHERE_STRIDE,
			positionOffset: 0,
			normalOffset: SPHERE_NORMAL_OFFSET,
			length,
			step,
		});
		next.setScene(scene);
		instance.geometry = next;
		previous.remove();
	}, [showNormals, normalColor, length, step]);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<canvas ref={canvasRef} className="block h-full w-full" />
			<div className="absolute left-4 top-4 flex w-80 flex-col gap-3 rounded-2xl border border-white/10 bg-[rgba(9,12,16,0.88)] p-4 text-white shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
				<div className="flex items-center gap-2">
					<span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
					<h2 className="text-sm font-semibold tracking-wide">
						法线可视化{" "}
						<span className="font-normal text-white/45">Normal Visualization</span>
					</h2>
				</div>
				<p className="text-xs leading-relaxed text-white/55">
					createNormalVisualization() 读取几何体的 position /
					normal，把每个采样顶点的法线展开成一条线段。
				</p>

				<div className="flex items-center justify-between text-xs">
					<span className="text-white/70">显示法线</span>
					<Switch size="small" checked={showNormals} onChange={setShowNormals} />
				</div>
				<div className="flex items-center justify-between text-xs">
					<span className="text-white/70">
						按法线方向着色 <span className="text-white/35">RGB = xyz</span>
					</span>
					<Switch
						size="small"
						checked={normalColor}
						onChange={setNormalColor}
						disabled={!showNormals}
					/>
				</div>

				<div>
					<div className="flex items-center justify-between text-[11px] text-white/55">
						<span>线段长度</span>
						<span className="font-mono tabular-nums text-cyan-200">
							{length.toFixed(2)}
						</span>
					</div>
					<Slider
						className="!my-1"
						min={0.05}
						max={0.6}
						step={0.01}
						value={length}
						onChange={setLength}
						disabled={!showNormals}
						tooltip={{ open: false }}
						railStyle={{ background: "rgba(255,255,255,0.14)" }}
						trackStyle={{ background: "#22d3ee" }}
					/>
				</div>
				<div>
					<div className="flex items-center justify-between text-[11px] text-white/55">
						<span>采样步长</span>
						<span className="font-mono tabular-nums text-cyan-200">
							每 {step} 个顶点
						</span>
					</div>
					<Slider
						className="!my-1"
						min={1}
						max={8}
						step={1}
						value={step}
						onChange={setStep}
						disabled={!showNormals}
						tooltip={{ open: false }}
						railStyle={{ background: "rgba(255,255,255,0.14)" }}
						trackStyle={{ background: "#22d3ee" }}
					/>
				</div>

				<div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-[11px] leading-relaxed text-white/45">
					球面是共享顶点几何体：同一顶点只有一条法线，所以线段呈平滑放射状。换成硬边立方体时，每个面会各自出一组法线。
				</div>
				<div className="text-[11px] text-white/35">拖拽画布旋转视角 · 滚轮前后移动</div>
			</div>
		</div>
	);
}
