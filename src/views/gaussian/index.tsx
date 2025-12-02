import { useMount, useUnmount } from "ahooks";
import { useRef } from "react";
import {
	AxesHelper,
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
// @ts-expect-error test
import { Viewer } from "@mkkellogg/gaussian-splats-3d";
import { SparkControls } from "@sparkjsdev/spark";

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
		const controls = new SparkControls({
			canvas: renderer.domElement,
		});
		renderer.setSize(
			containerRef.current?.offsetWidth,
			containerRef.current?.offsetHeight,
		);
		camera.position.set(0, 0, 7);
		camera.up.set(0, 1, 0);
		camera.lookAt(-1, -5, 7);
		sceneRef.current.add(new AxesHelper(4));

		function animate() {
			// renderer.render(
			// 	sceneRef.current as Scene,
			// 	camera,
			// );
			renderer.setSize(
				containerRef.current?.offsetWidth || 0,
				containerRef.current?.offsetHeight || 0,
			);
			viewer.update();
			viewer.render();
			controls.update(camera);
		}
		void animate;
		containerRef.current?.appendChild(
			renderer.domElement,
		);
		const viewer = new Viewer({
			renderer,
			camera,
			threeScene: sceneRef.current,
		});
		viewer
			.addSplatScene(
				"/assets/model/converted_file.ksplat",
				{
					showLoadingUI: true,
					useBuiltInControls: true,
					selfDrivenMode: true,
					ignoreDevicePixelRatio: 4,
				},
			)
			.then(() => {
				viewer.start();
				// renderer.setAnimationLoop(animate);
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
