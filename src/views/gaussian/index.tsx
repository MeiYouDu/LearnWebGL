import { useRef } from "react";
import {
	AxesHelper,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import { useMount, useUnmount } from "ahooks";
// @ts-expect-error test
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function GaussianSplats3DDemo() {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<Scene>(null);
	useMount(function () {
		if (sceneRef.current) return;
		if (!containerRef.current) return;
		sceneRef.current = new Scene();
		const camera = new PerspectiveCamera(
			75,
			containerRef.current?.offsetWidth /
				containerRef.current?.offsetHeight,
			0.1,
			1000,
		);
		const renderer = new WebGLRenderer();
		const controls = new OrbitControls(
			camera,
			renderer.domElement,
		);
		renderer.setSize(
			containerRef.current?.offsetWidth,
			containerRef.current?.offsetHeight,
		);
		renderer.setAnimationLoop(animate);
		camera.position.x = 5;
		sceneRef.current.add(new AxesHelper(4));

		function animate() {
			controls.update();
			renderer.render(
				sceneRef.current as Scene,
				camera,
			);
		}
		containerRef.current?.appendChild(
			renderer.domElement,
		);
		const viewer = new GaussianSplats3D.Viewer({
			renderer,
			camera,
			threeScene: sceneRef.current,
		});
		viewer
			.addSplatScene("/assets/model/garden.ksplat", {
				splatAlphaRemovalThreshold: 5,
				showLoadingUI: true,
				useBuiltInControl: true,
				selfDrivenMode: false,

				// position: [0, 1, 0],
				rotation: [-1, 0, 0, 0],
				// scale: [1.5, 1.5, 1.5],
			})
			.then(() => {
				viewer.start();
			});
	});
	useUnmount(() => {});
	return (
		<div
			className={"h-full w-full"}
			ref={containerRef}
			id={"container"}></div>
	);
}

export { GaussianSplats3DDemo };
