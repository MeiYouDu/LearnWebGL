import { useSceneHook } from "@/views/gaussian/hooks/useScene.hook.ts";
import { Switch } from "antd";

function SparkDemo() {
	const { containerRef, switchHandle } = useSceneHook();

	return (
		<div className={"relative h-full w-full"} id={"container"}>
			<Switch
				className={"absolute"}
				unCheckedChildren="高斯"
				checkedChildren={"点云"}
				defaultChecked
				onChange={switchHandle}></Switch>
			<canvas className={"h-full w-full"} ref={containerRef}></canvas>
		</div>
	);
}
export { SparkDemo };
