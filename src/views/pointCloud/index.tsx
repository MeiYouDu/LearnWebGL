import { Button, message } from "antd";
import { useLayoutEffect, useRef, useState } from "react";
import {
	AxesHelper,
	Box3,
	PerspectiveCamera,
	Points,
	PointsMaterial,
	Scene,
	ShaderMaterial,
	Vector3,
	WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader";
import frag from "./shader.frag";
import vert from "./shader.vert";

function PointCloudPage() {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<Scene | null>(null);
	const cameraRef = useRef<PerspectiveCamera | null>(null);
	const rendererRef = useRef<WebGLRenderer | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const pointCloudRef = useRef<Points | null>(null);
	const loaderRef = useRef<PCDLoader>(new PCDLoader());
	const fileInputRef = useRef<HTMLInputElement>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const disposedRef = useRef(false);
	const [loading, setLoading] = useState(false);

	useLayoutEffect(() => {
		disposedRef.current = false;

		const container = containerRef.current;
		if (!container || container.offsetWidth === 0) return;

		const scene = new Scene();
		sceneRef.current = scene;

		const camera = new PerspectiveCamera(
			60,
			container.offsetWidth / container.offsetHeight,
			0.1,
			1000,
		);
		camera.position.set(0, 0, 10);
		cameraRef.current = camera;

		const renderer = new WebGLRenderer({ antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(container.offsetWidth, container.offsetHeight);
		container.appendChild(renderer.domElement);
		rendererRef.current = renderer;

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.1;
		controlsRef.current = controls;

		scene.add(new AxesHelper(5));

		renderer.setAnimationLoop(() => {
			controls.update();
			renderer.render(scene, camera);
		});

		resizeObserverRef.current = new ResizeObserver(() => {
			if (!container || container.offsetWidth === 0) return;
			camera.aspect = container.offsetWidth / container.offsetHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(container.offsetWidth, container.offsetHeight);
		});
		resizeObserverRef.current.observe(container);

		return () => {
			disposedRef.current = true;

			rendererRef.current?.setAnimationLoop(null);
			controlsRef.current?.dispose();
			resizeObserverRef.current?.disconnect();
			if (rendererRef.current) {
				container.removeChild(rendererRef.current.domElement);
			}

			if (pointCloudRef.current) {
				pointCloudRef.current.geometry.dispose();
				(pointCloudRef.current.material as PointsMaterial).dispose();
				sceneRef.current?.remove(pointCloudRef.current);
			}

			rendererRef.current?.dispose();
			sceneRef.current?.clear();
			sceneRef.current = null;
		};
	}, []);

	const handleLoadClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!sceneRef.current) {
			message.error("场景未初始化，请刷新页面");
			return;
		}

		setLoading(true);
		const url = URL.createObjectURL(file);

		loaderRef.current
			.loadAsync(url, () => {
				// onProgress - PCDLoader doesn't report progress, but loadAsync accepts it
			})
			.then((points: Points) => {
				if (disposedRef.current) return;

				if (pointCloudRef.current) {
					pointCloudRef.current.geometry.dispose();
					(pointCloudRef.current.material as PointsMaterial).dispose();
					sceneRef.current?.remove(pointCloudRef.current);
				}

				pointCloudRef.current = points;
				sceneRef.current?.add(points);

				const box = new Box3().setFromObject(points);
				const center = new Vector3();
				box.getCenter(center);
				const size = new Vector3();
				box.getSize(size);
				const maxDim = Math.max(size.x, size.y, size.z);
				points.material = new ShaderMaterial({
					vertexShader: vert,
					fragmentShader: frag,
					uniforms: {
						size: {
							value: 2,
						},
					},
				});
				// if (points.material instanceof PointsMaterial) {
				// 	(points.material as PointsMaterial).size = 1;
				// 	(points.material as PointsMaterial).sizeAttenuation = false;
				// }
				// console.log(material);

				const camera = cameraRef.current;
				const controls = controlsRef.current;
				if (camera && controls) {
					const dist = maxDim * 1.5;
					camera.position.set(
						center.x + dist * 0.5,
						center.y + dist * 0.3,
						center.z + dist,
					);
					camera.lookAt(center);
					controls.target.copy(center);
					controls.update();
				}

				message.success(`已加载: ${file.name}`);
			})
			.catch((err: unknown) => {
				console.error("PCD load failed:", err);
				message.error(`PCD 解析失败: ${err instanceof Error ? err.message : "未知错误"}`);
			})
			.finally(() => {
				setLoading(false);
				URL.revokeObjectURL(url);
				if (fileInputRef.current) fileInputRef.current.value = "";
			});
	};

	return (
		<div className="relative h-full w-full">
			<div className="absolute top-4 left-4 z-10">
				<Button type="primary" loading={loading} onClick={handleLoadClick}>
					加载PCD文件
				</Button>
			</div>
			<input
				ref={fileInputRef}
				type="file"
				accept=".pcd"
				className="hidden"
				onChange={handleFileChange}
			/>
			<div ref={containerRef} className="h-full w-full" />
		</div>
	);
}

export default PointCloudPage;
