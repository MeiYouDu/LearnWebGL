import { Button, Input, message, Space } from "antd";
import { useLayoutEffect, useRef, useState } from "react";
import {
	AmbientLight,
	AxesHelper,
	DirectionalLight,
	GridHelper,
	LoadingManager,
	Object3D,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import URDFLoader from "urdf-loader";

function URDFLoaderPage() {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<Scene | null>(null);
	const cameraRef = useRef<PerspectiveCamera | null>(null);
	const rendererRef = useRef<WebGLRenderer | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);
	const robotRef = useRef<Object3D | null>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const disposedRef = useRef(false);

	const [url, setUrl] = useState("");
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
			0.01,
			1000,
		);
		camera.position.set(2, 2, 2);
		cameraRef.current = camera;

		const renderer = new WebGLRenderer({ antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(container.offsetWidth, container.offsetHeight);
		renderer.shadowMap.enabled = true;
		container.appendChild(renderer.domElement);
		rendererRef.current = renderer;

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.1;
		controls.target.set(0, 0.5, 0);
		controlsRef.current = controls;

		const ambientLight = new AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		const directionalLight = new DirectionalLight(0xffffff, 1);
		directionalLight.position.set(5, 10, 5);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.set(1024, 1024);
		scene.add(directionalLight);

		scene.add(new AxesHelper(2));
		scene.add(new GridHelper(5, 20));

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
			renderer.setAnimationLoop(null);
			controls.dispose();
			resizeObserverRef.current?.disconnect();
			if (rendererRef.current) {
				container.removeChild(renderer.domElement);
				rendererRef.current.dispose();
			}
			scene.clear();
			sceneRef.current = null;
		};
	}, []);

	const handleLoad = () => {
		const trimmedUrl = url.trim();
		if (!trimmedUrl) {
			message.warning("请输入 URDF 文件 URL");
			return;
		}

		const scene = sceneRef.current;
		if (!scene) {
			message.error("场景未初始化，请刷新页面");
			return;
		}

		setLoading(true);

		const manager = new LoadingManager();
		const loader = new URDFLoader(manager);
		loader
			.loadAsync(trimmedUrl)
			.then((robot) => {
				if (disposedRef.current) return;

				if (robotRef.current) {
					scene.remove(robotRef.current);
				}

				robotRef.current = robot;
				scene.add(robot);

				// robot.traverse((child) => {
				// 	if ((child as Mesh).isMesh) {
				// 		const mesh = child as Mesh;
				// 		mesh.castShadow = true;
				// 		mesh.receiveShadow = true;
				// 	}
				// });

				// const box = new Box3().setFromObject(robot);
				// const center = new Vector3();
				// box.getCenter(center);
				// const size = new Vector3();
				// box.getSize(size);
				// const maxDim = Math.max(size.x, size.y, size.z);

				// const camera = cameraRef.current;
				// const controls = controlsRef.current;
				// if (camera && controls) {
				// 	const dist = maxDim * 2;
				// 	camera.position.set(
				// 		center.x + dist * 0.5,
				// 		center.y + dist * 0.3,
				// 		center.z + dist,
				// 	);
				// 	controls.target.copy(center);
				// 	controls.update();
				// }

				// message.success("URDF 加载成功");
			})
			.catch((err: unknown) => {
				console.error("URDF load failed:", err);
				message.error(`加载失败: ${err instanceof Error ? err.message : "未知错误"}`);
			})
			.finally(() => {
				setLoading(false);
			});
	};

	return (
		<div className="relative h-full w-full">
			<div className="absolute top-4 left-4 right-4 z-10">
				<Space.Compact className="w-full">
					<Input
						placeholder="输入 URDF 文件 URL"
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onPressEnter={handleLoad}
						allowClear
					/>
					<Button type="primary" loading={loading} onClick={handleLoad}>
						加载
					</Button>
				</Space.Compact>
			</div>
			<div ref={containerRef} className="h-full w-full" />
		</div>
	);
}

export default URDFLoaderPage;
