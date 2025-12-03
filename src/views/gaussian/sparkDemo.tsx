import { alphaFromColor } from "@/utils";
import {
	SparkControls,
	SparkRenderer,
	SplatMesh,
} from "@sparkjsdev/spark";
import { useMount, useUnmount } from "ahooks";
import { Switch } from "antd";
import { useRef } from "react";
import {
	AxesHelper,
	BufferGeometry,
	Float32BufferAttribute,
	MathUtils,
	PerspectiveCamera,
	Points,
	PointsMaterial,
	Quaternion,
	Scene,
	Vector3,
	WebGLRenderer,
} from "three";

function SparkDemo() {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<Scene>(null);
	const rendererRef = useRef<SparkRenderer>(null);
	const cameraRef = useRef<PerspectiveCamera>(null);
	const controlRef = useRef<SparkControls>(null);
	const splatMeshRef = useRef<SplatMesh>(null);
	const pointsRef = useRef<Points>(null);
	useMount(async function () {
		if (sceneRef.current) return;
		if (!containerRef.current) return;
		sceneRef.current = new Scene();
		cameraRef.current = new PerspectiveCamera(
			45,
			containerRef.current?.offsetWidth /
				containerRef.current?.offsetHeight,
			2,
			200,
		);
		cameraRef.current.position.set(
			-1.96397,
			-7.77895,
			6.89202,
		);
		cameraRef.current.up.set(0, 0, 1);
		cameraRef.current.lookAt(
			-1.38789,
			-14.37853,
			6.65558,
		);
		rendererRef.current = new SparkRenderer({
			renderer: new WebGLRenderer(),
			falloff: 0.0, // 0 -> no gaussian falloff (更像 flat disks / points)
			minPixelRadius: 0.0, // 最小像素半径
			maxPixelRadius: 0.4, // 限制最大大小，尽量小
			minAlpha: 1.0,
		});
		controlRef.current = new SparkControls({
			canvas: rendererRef.current.renderer.domElement,
		});
		rendererRef.current.renderer.setSize(
			containerRef.current?.offsetWidth,
			containerRef.current?.offsetHeight,
		);

		splatMeshRef.current = new SplatMesh({
			url: "/assets/model/converted_file.ksplat",
		});
		sceneRef.current.add(splatMeshRef.current);
		sceneRef.current.add(new AxesHelper(4));
		await splatMeshRef.current.initialized;
		const geometry = new BufferGeometry();
		const positions: number[] = [];
		const colors: number[] = [];

		let alpha: number;
		splatMeshRef.current.forEachSplat(
			(...[, center, , , , color]) => {
				positions.push(
					center.x,
					center.y,
					center.z,
				);
				alpha = alphaFromColor(color);
				colors.push(
					color.r,
					color.g,
					color.b,
					alpha,
				);
			},
		);
		geometry.setAttribute(
			"position",
			new Float32BufferAttribute(positions, 3),
		);
		geometry.setAttribute(
			"color",
			new Float32BufferAttribute(colors, 4),
		);
		pointsRef.current = new Points(
			geometry,
			new PointsMaterial({
				size: 0.01, // 像素大小，按需调整
				vertexColors: true,
				// sizeAttenuation: false,
				transparent: true,
			}),
		);
		pointsRef.current.visible = false;
		const qx = new Quaternion().setFromAxisAngle(
			new Vector3(1, 0, 0),
			MathUtils.degToRad(-120),
		);
		const qz = new Quaternion().setFromAxisAngle(
			new Vector3(0, 0, 1),
			MathUtils.degToRad(-17.5),
		);
		const q = new Quaternion()
			.multiplyQuaternions(qz, qx)
			.normalize();
		void q;
		// splatMeshRef.current.quaternion.copy(q);
		// pointsRef.current.quaternion.copy(q);
		sceneRef.current.add(pointsRef.current);
		rendererRef.current.renderer.setAnimationLoop(
			animate,
		);
		function animate() {
			if (!cameraRef.current) return;
			controlRef.current?.update(cameraRef?.current);
			rendererRef.current?.renderer.setSize(
				containerRef.current?.offsetWidth || 0,
				(containerRef.current?.offsetHeight || 0) -
					1,
			);
			rendererRef.current?.renderer.render(
				sceneRef.current as Scene,
				cameraRef?.current,
			);
		}
		containerRef.current?.appendChild(
			rendererRef.current.renderer.domElement,
		);
	});
	useUnmount(() => {
		// sceneRef.current?.remove(
		// 	splatMeshRef.current as Object3D,
		// 	pointsRef.current as Object3D,
		// );
		// sceneRef.current = null;
		// rendererRef.current?.renderer.dispose();
		// rendererRef.current = null;
		// cameraRef.current = null;
		// controlRef.current = null;
		// splatMeshRef.current?.dispose();
		// splatMeshRef.current = null;
	});
	function switchHandle(val: boolean) {
		if (!splatMeshRef.current || !pointsRef.current)
			return;
		if (val) {
			splatMeshRef.current.visible = true;
			pointsRef.current.visible = false;
		} else {
			splatMeshRef.current.visible = false;
			pointsRef.current.visible = true;
		}
	}
	return (
		<div
			className={"relative h-full w-full"}
			ref={containerRef}
			id={"container"}>
			<Switch
				className={"absolute"}
				unCheckedChildren="点云"
				checkedChildren={"高斯泼溅"}
				defaultChecked
				onChange={switchHandle}></Switch>
		</div>
	);
}
export { SparkDemo };
