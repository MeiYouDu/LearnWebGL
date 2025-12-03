import { Switch } from "antd";
import { useSceneHook } from "@/views/gaussian/hooks/useScene.hook.ts";

function SparkDemo() {
	const { containerRef, switchHandle } = useSceneHook();

	return (
		<div
			className={"relative h-full w-full"}
			id={"container"}>
			<Switch
				className={"absolute"}
				unCheckedChildren="点云"
				checkedChildren={"高斯泼溅"}
				defaultChecked
				onChange={switchHandle}></Switch>
			<canvas
				className={"h-full w-full"}
				ref={containerRef}></canvas>
		</div>
	);
}
export { SparkDemo };
