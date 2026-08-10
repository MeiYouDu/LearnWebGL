import { alphaFromColor } from "@/utils";
import { UploadOutlined } from "@ant-design/icons";
import {
	getSplatFileType,
	PackedSplats,
	SparkControls,
	SparkRenderer,
	SplatFileType,
	SplatLoader,
	SplatMesh,
} from "@sparkjsdev/spark";
import { Button, message, Switch, Upload } from "antd";
import { useCallback, useEffect, useRef } from "react";
import {
	Box3,
	BufferGeometry,
	Color,
	Float32BufferAttribute,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Points,
	PointsMaterial,
	Raycaster,
	Scene,
	SphereGeometry,
	Vector2,
	Vector3,
	WebGLRenderer,
} from "three";

/** 根据扩展名回退识别文件类型（splat 文件无 magic，只能靠扩展名） */
function getSplatFileTypeByExtension(fileName: string): SplatFileType | undefined {
	const lower = fileName.toLowerCase();
	if (lower.endsWith(".spz")) return SplatFileType.SPZ;
	if (lower.endsWith(".splat")) return SplatFileType.SPLAT;
	if (lower.endsWith(".rad")) return SplatFileType.RAD;
	return undefined;
}

/** 遍历 splat 数据构建点云 Points，用预分配的 Float32Array 直接写入（避免 number[] push 的内存风暴） */
function buildPoints(data: PackedSplats): Points {
	const source = data.lodSplats ?? data;
	const count = source.numSplats;
	const positions = new Float32Array(count * 3);
	const colors = new Float32Array(count * 4);
	source.forEachSplat((index, center, _scales, _quaternion, _opacity, color) => {
		const i3 = index * 3;
		positions[i3] = center.x;
		positions[i3 + 1] = center.y;
		positions[i3 + 2] = center.z;
		const i4 = index * 4;
		colors[i4] = color.r;
		colors[i4 + 1] = color.g;
		colors[i4 + 2] = color.b;
		colors[i4 + 3] = alphaFromColor(color);
	});
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.setAttribute("color", new Float32BufferAttribute(colors, 4));
	return new Points(
		geometry,
		new PointsMaterial({ size: 0.01, vertexColors: true, transparent: true }),
	);
}

function SparkDemo() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const sceneRef = useRef<Scene>(null);
	const cameraRef = useRef<PerspectiveCamera>(null);
	const splatLoaderRef = useRef<SplatLoader>(null);
	const splatMeshRef = useRef<SplatMesh>(null);
	const pointsRef = useRef<Points>(null);
	const dataRef = useRef<PackedSplats>(null);
	const markerRef = useRef<Mesh>(null);
	const isPointsModeRef = useRef(true);

	/** 初始化 three + spark 渲染管线（SparkRenderer 驱动 LOD 与 splat 排序） */
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const renderer = new WebGLRenderer({ canvas, antialias: false });
		const scene = new Scene();
		scene.background = new Color(0x1a1a2e);
		const camera = new PerspectiveCamera(75, 1, 0.1, 1000);
		// lodRaycast 调大：拾取用的 LoD splat 集合更密，物体边缘覆盖更完整，减少穿透
		const sparkRenderer = new SparkRenderer({ renderer, lodRaycast: 50000 });
		scene.add(sparkRenderer);
		const controls = new SparkControls({ canvas });
		const loader = new SplatLoader();
		sceneRef.current = scene;
		cameraRef.current = camera;
		splatLoaderRef.current = loader;

		function resize() {
			const target = canvasRef.current;
			if (!target) return;
			const width = target.clientWidth;
			const height = target.clientHeight;
			if (!width || !height) return;
			renderer.setSize(width, height, false);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		}
		resize();
		window.addEventListener("resize", resize);

		// 点击拾取：SplatMesh 实现了 three.js Raycaster 兼容的 raycast（官方推荐做法），
		// 命中 point 为世界坐标，直接在命中处放置标记小球
		const marker = new Mesh(
			new SphereGeometry(0.01),
			new MeshBasicMaterial({ color: 0xff5533 }),
		);
		marker.visible = false;
		scene.add(marker);
		markerRef.current = marker;
		const raycaster = new Raycaster();
		let pointerDownPos: Vector2 | null = null;
		const onPointerDown = (event: PointerEvent) => {
			pointerDownPos = new Vector2(event.clientX, event.clientY);
		};
		const onClick = (event: MouseEvent) => {
			// 拖拽旋转相机后松开也会触发 click，位移小于阈值才视为点击
			if (
				pointerDownPos &&
				pointerDownPos.distanceTo(new Vector2(event.clientX, event.clientY)) > 5
			) {
				return;
			}
			const mesh = splatMeshRef.current;
			if (!mesh) return;
			// 阈值调小，让物体边缘的半透明 splat 也参与拾取，避免射线穿透到物体后面
			mesh.minRaycastOpacity = 0.005;
			// canvas 在 antd Layout 中不在 viewport 原点，需用 rect 换算 canvas 内坐标
			const rect = canvas.getBoundingClientRect();
			const ndc = new Vector2(
				((event.clientX - rect.left) / rect.width) * 2 - 1,
				-((event.clientY - rect.top) / rect.height) * 2 + 1,
			);
			raycaster.setFromCamera(ndc, camera);
			const hits = raycaster.intersectObject(mesh);
			if (hits.length > 0) {
				marker.position.copy(hits[0].point);
				marker.visible = true;
			}
		};
		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("click", onClick);

		renderer.setAnimationLoop(() => {
			controls.update(camera);
			renderer.render(scene, camera);
		});
		return () => {
			window.removeEventListener("resize", resize);
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("click", onClick);
			renderer.setAnimationLoop(null);
			controls.fpsMovement.enable = false;
			controls.pointerControls.enable = false;
			splatMeshRef.current?.dispose();
			pointsRef.current?.geometry.dispose();
			(pointsRef.current?.material as PointsMaterial | undefined)?.dispose();
			marker.geometry.dispose();
			marker.material.dispose();
			markerRef.current = null;
			sparkRenderer.dispose();
			renderer.dispose();
		};
	}, []);

	/**
	 * Z-up 适配（方案 B）：数据保持原始坐标，相机从侧面略俯视看（初始 pitch ≈ 25°）。
	 * SparkControls 的旋转基于相机局部轴（yaw 绕 camera.up），up 设为 (0,0,1) 即正确；
	 * 但正上方俯视会让 YXZ 欧拉的 pitch 卡在 clamp ±90° 边缘（万向锁，水平拖动退化为翻转），
	 * 所以初始视角离开 ±90° 区域。
	 */
	function setupCameraTransform(data: PackedSplats) {
		const camera = cameraRef.current;
		if (!camera) return;
		const source = data.lodSplats ?? data;
		const bounds = new Box3();
		source.forEachSplat((_index, center) => {
			bounds.expandByPoint(center);
		});
		if (bounds.isEmpty()) return;
		const center = new Vector3();
		const size = bounds.getSize(new Vector3());
		const isZUp = size.z < size.y;
		const maxDim = Math.max(size.x, size.y, size.z);
		// 标记小球半径按模型尺寸适配（约 2% 最大边长）
		const marker = markerRef.current;
		if (marker) marker.scale.setScalar(maxDim * 0.02);
		if (isZUp) {
			camera.up.set(0, 0, 1);
			// 从 +Y 侧面看，视线沿 -Y 略俯视（Z 方向抬高）
			camera.position.set(center.x, center.y, center.z);
			camera.lookAt(center);
		} else {
			camera.up.set(0, -1, 0);
			camera.position.set(center.x, center.y, center.z);
			camera.lookAt(center);
		}
	}

	/** 应用渲染模式：true 点云 / false 高斯；点云懒构建并缓存 */
	const applyMode = useCallback((isPoints: boolean) => {
		isPointsModeRef.current = isPoints;
		if (isPoints) {
			if (splatMeshRef.current) splatMeshRef.current.visible = false;
			const data = dataRef.current;
			if (data) {
				if (!pointsRef.current) {
					const points = buildPoints(data);
					// 点云直接加入 scene，与 splatMesh 同在原始 Z-up 坐标空间
					sceneRef.current?.add(points);
					pointsRef.current = points;
				}
				pointsRef.current.visible = true;
			}
		} else {
			if (pointsRef.current) pointsRef.current.visible = false;
			if (splatMeshRef.current) splatMeshRef.current.visible = true;
		}
	}, []);

	/** 加载本地 .splat / .spz 文件，开启 LOD（解码时在 worker 中构建 LOD 树） */
	const loadLocalFile = useCallback(
		async (file: File) => {
			const loader = splatLoaderRef.current;
			if (!loader) return;
			try {
				const fileBytes = new Uint8Array(await file.arrayBuffer());
				const fileType =
					getSplatFileType(fileBytes) ?? getSplatFileTypeByExtension(file.name);
				if (!fileType) throw new Error("无法识别的文件格式，仅支持 .splat / .spz");
				const data = (await loader.loadInternalAsync({
					fileBytes,
					fileType,
					fileName: file.name,
					lod: true,
				})) as PackedSplats;
				// 清理旧资源
				splatMeshRef.current?.dispose();
				splatMeshRef.current?.removeFromParent();
				pointsRef.current?.removeFromParent();
				pointsRef.current?.geometry.dispose();
				(pointsRef.current?.material as PointsMaterial | undefined)?.dispose();
				pointsRef.current = null;
				dataRef.current = data;
				// 挂载新数据（Z-up 时 setupCameraTransform 把相机放进旋转 Group 适配）并应用当前模式
				const splatMesh = new SplatMesh({ packedSplats: data });
				sceneRef.current?.add(splatMesh);
				splatMeshRef.current = splatMesh;
				setupCameraTransform(data);
				applyMode(isPointsModeRef.current);
				message.success("加载成功");
			} catch (error: unknown) {
				message.error(error instanceof Error ? error.message : "文件加载失败");
			}
		},
		[applyMode],
	);

	return (
		<div className={"relative h-full w-full"}>
			<div className={"absolute z-10 flex gap-2"}>
				<Switch
					unCheckedChildren="高斯"
					checkedChildren={"点云"}
					defaultChecked
					onChange={applyMode}></Switch>
				<Upload
					accept={".splat,.spz,.rad"}
					showUploadList={false}
					beforeUpload={(file) => {
						void loadLocalFile(file);
						return false;
					}}>
					<Button size="small" icon={<UploadOutlined />}>
						加载本地文件
					</Button>
				</Upload>
			</div>
			<div className={"relative h-full w-full"}>
				<canvas className={"h-full w-full"} ref={canvasRef}></canvas>
			</div>
		</div>
	);
}
export { SparkDemo };
