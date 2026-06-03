import { Button, Input, message, Slider, Space } from "antd";
import { useEffect, useRef, useState } from "react";
import {
	AmbientLight,
	AxesHelper,
	DirectionalLight,
	GridHelper,
	LoadingManager,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import URDFLoader, { URDFRobot } from "urdf-loader";

interface DATA {
	action: Array<Array<number>>;
	joint_names: Array<string>;
	frames: Array<{
		timestamp: number;
		joint_position: Array<number>;
	}>;
}
function URDFLoaderPage() {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<Scene | null>(null);
	const cameraRef = useRef<PerspectiveCamera | null>(null);
	const rendererRef = useRef<WebGLRenderer | null>(null);
	const controlsRef = useRef<OrbitControls | null>(null);

	const robotRef = useRef<URDFRobot>(null);
	const resizeObserverRef = useRef<ResizeObserver | null>(null);
	const disposedRef = useRef(false);
	const currentFrameRef = useRef(0);
	const totalFramesRef = useRef(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
	const stateDataRef = useRef<DATA | null>(null);

	const [url, setUrl] = useState(
		"http://localhost:2000/genie-robot-description/urdf/G2_t2_crsB/G2_t2_crsB_omnipicker.urdf",
	);
	const [loading, setLoading] = useState(false);
	const [currentFrame, setCurrentFrame] = useState(0);

	useEffect(() => {
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
			if (timerRef.current) clearInterval(timerRef.current);
			if (rendererRef.current) {
				container.removeChild(renderer.domElement);
				rendererRef.current.dispose();
			}
			scene.clear();
			sceneRef.current = null;
		};
	}, []);

	const applyFrame = (frame: number) => {
		const robot = robotRef.current;
		const state = stateDataRef.current;
		if (!robot || !state) return;
		const data: Record<string, number> = {};
		state.joint_names.forEach((name, i) => {
			data[name] = state.frames[frame].joint_position[i];
		});
		robot.setJointValues(data);
	};

	const handleLoad = async () => {
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

		try {
			const manager = new LoadingManager();
			const loader = new URDFLoader(manager);
			const state = (await (
				await fetch("/assets/data/trajectory.json", { method: "get" })
			).json()) as DATA;
			stateDataRef.current = state;
			const actionLength = state.frames.length;
			totalFramesRef.current = actionLength;
			currentFrameRef.current = 0;
			setCurrentFrame(0);

			const robot = await loader.loadAsync(trimmedUrl);

			if (disposedRef.current) return;

			if (robotRef.current) {
				scene.remove(robotRef.current);
			}

			robotRef.current = robot;
			robot.rotation.x = -Math.PI / 2; // ROS Z-up → Three.js Y-up
			scene.add(robot);
			console.log(state);
			if (timerRef.current) clearInterval(timerRef.current);
			timerRef.current = setInterval(() => {
				if (currentFrameRef.current >= actionLength) {
					currentFrameRef.current = 0;
				}
				applyFrame(currentFrameRef.current);
				setCurrentFrame(currentFrameRef.current);
				currentFrameRef.current++;
			}, 16);
		} catch (err: unknown) {
			console.error("URDF load failed:", err);
			message.error(`加载失败: ${err instanceof Error ? err.message : "未知错误"}`);
		} finally {
			setLoading(false);
		}
	};

	const handleSliderChange = (value: number) => {
		currentFrameRef.current = value;
		setCurrentFrame(value);
		applyFrame(value);
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
			{totalFramesRef.current > 0 && (
				<div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-3 rounded-lg bg-white/80 px-4 py-2">
					<span className="whitespace-nowrap text-xs text-gray-500 min-w-32">
						帧 {currentFrame} / {totalFramesRef.current}
					</span>
					<Slider
						className="flex-1"
						min={0}
						max={totalFramesRef.current - 1}
						value={currentFrame}
						onChange={handleSliderChange}
						tooltip={{ formatter: (v) => `帧 ${v}` }}
					/>
				</div>
			)}
		</div>
	);
}

export default URDFLoaderPage;
