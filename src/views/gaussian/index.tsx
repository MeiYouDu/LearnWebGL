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

function Gaussian() {
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
		// const garden = new SplatMesh({
		// 	url: "/assets/model/garden_high.ksplat",
		// });
		// garden.quaternion.set(1, 0, 0, 0);
		// garden.position.set(0, 0, 0);
		// sceneRef.current.add(garden);
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
			.addSplatScene(
				"/assets/model/garden_high.ksplat",
				{
					splatAlphaRemovalThreshold: 5,
					showLoadingUI: true,
					position: [0, 1, 0],
					rotation: [0, 0, 0, 1],
					scale: [1.5, 1.5, 1.5],
				},
			)
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

export { Gaussian };
