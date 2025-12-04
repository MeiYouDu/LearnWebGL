import { RefObject, useEffect, useRef } from "react";
import {
	AxesHelper,
	Object3D,
	Object3DEventMap,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import {
	SparkControls,
	SparkRenderer,
} from "@sparkjsdev/spark";
import { useSplatLoadHook } from "@/views/gaussian/hooks/useSplatLoad.hook.ts";
import { useHover } from "ahooks";

interface ReturnType {
	containerRef: RefObject<HTMLCanvasElement | null>;
	sceneRef: RefObject<Scene<Object3DEventMap> | null>;
	rendererRef: RefObject<SparkRenderer | null>;
	cameraRef: RefObject<PerspectiveCamera | null>;
	controlRef: RefObject<SparkControls | null>;
	switchHandle: (val: boolean) => void;
}

function useSceneHook(): ReturnType {
	const containerRef = useRef<HTMLCanvasElement>(null);
	/**
	 * 鼠标 hover 时请求下一帧
	 */
	const isHover = useRef(false);
	const sceneRef = useRef<Scene>(null);
	const rendererRef = useRef<SparkRenderer>(null);
	const cameraRef = useRef<PerspectiveCamera>(null);
	const controlRef = useRef<SparkControls>(null);
	const { pointsRef, splatMeshRef } = useSplatLoadHook(
		"/assets/model/converted_file.ksplat",
	);
	useHover(containerRef, {
		onChange: (isFocusWithin: boolean) => {
			isHover.current = isFocusWithin;
		},
	});
	function switchHandle(val: boolean) {
		if (!splatMeshRef.current || !pointsRef.current)
			return;
		if (val) {
			splatMeshRef.current.visible = false;
			pointsRef.current.visible = true;
		} else {
			splatMeshRef.current.visible = true;
			pointsRef.current.visible = false;
		}
	}
	useEffect(() => {
		if (!containerRef.current) return;
		if (!containerRef.current.parentElement) return;
		sceneRef.current = new Scene();
		cameraRef.current = new PerspectiveCamera(
			45,
			containerRef.current.parentElement.offsetWidth /
				containerRef.current?.parentElement
					.offsetHeight,
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
			renderer: new WebGLRenderer({
				canvas: containerRef.current,
			}),
			falloff: 0.0, // 0 -> no gaussian falloff (更像 flat disks / points)
			minPixelRadius: 0.0, // 最小像素半径
			maxPixelRadius: 0.4, // 限制最大大小，尽量小
		});
		controlRef.current = new SparkControls({
			canvas: rendererRef.current.renderer.domElement,
		});
		rendererRef.current.renderer.setSize(
			containerRef.current?.parentElement.offsetWidth,
			containerRef.current?.parentElement
				.offsetHeight,
		);
		sceneRef.current.add(new AxesHelper(8));
		if (pointsRef.current)
			sceneRef.current?.add(pointsRef.current);
		if (splatMeshRef.current)
			sceneRef.current?.add(splatMeshRef.current);

		rendererRef.current.renderer.setAnimationLoop(
			animate,
		);
		function animate() {
			if (!isHover.current) return;
			if (!cameraRef.current) return;
			controlRef.current?.update(cameraRef?.current);
			rendererRef.current?.renderer.setSize(
				containerRef.current?.parentElement
					?.offsetWidth || 0,
				containerRef.current?.parentElement
					?.offsetHeight || 0,
			);
			rendererRef.current?.renderer.render(
				sceneRef.current as Scene,
				cameraRef?.current,
			);
		}
		return () => {
			sceneRef.current?.remove(
				pointsRef.current as Object3D,
			);
			rendererRef.current?.renderer.dispose();
			sceneRef.current = null;
			rendererRef.current = null;
			cameraRef.current = null;
			controlRef.current = null;
			pointsRef.current = null;
		};
	}, [pointsRef, splatMeshRef]);
	return {
		containerRef,
		sceneRef,
		rendererRef,
		cameraRef,
		controlRef,
		switchHandle,
	};
}

export { useSceneHook };
