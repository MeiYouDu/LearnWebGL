import { RefObject, useEffect, useRef } from "react";
import { useSplatLoadHook } from "@/views/gaussian/hooks/useSplatLoad.hook.ts";
import { useHover } from "ahooks";
import { SceneManager } from "@/views/gaussian/helper/sceneManager.ts";
import { Splat } from "@/views/gaussian/helper/splat.ts";

interface ReturnType {
	containerRef: RefObject<HTMLCanvasElement | null>;
	switchHandle: (val: boolean) => void;
}

function useSceneHook(): ReturnType {
	const containerRef = useRef<HTMLCanvasElement>(null);
	const sceneManagerRef = useRef<SceneManager>(null);
	const splatRef = useRef<Splat>(null);

	const { load } = useSplatLoadHook();
	function switchHandle(val: boolean) {
		if (val) {
			splatRef.current?.setPointsVisible(true);
			splatRef.current?.setSplatVisible(false);
		} else {
			splatRef.current?.setPointsVisible(false);
			splatRef.current?.setSplatVisible(true);
		}
		sceneManagerRef.current?.setNeedRender(true);
	}

	function setCameraProperty() {
		sceneManagerRef.current?.camera?.position.set(
			-1.96397,
			-7.77895,
			6.89202,
		);
		sceneManagerRef.current?.camera?.up.set(0, 0, 1);
		sceneManagerRef.current?.camera?.lookAt(
			-1.38789,
			-14.37853,
			6.65558,
		);
	}
	useHover(containerRef, {
		onChange: (isFocusWithin: boolean) => {
			SceneManager.getInstance().setNeedRender(
				isFocusWithin,
			);
		},
	});
	useEffect(() => {
		if (!containerRef.current) return;
		sceneManagerRef.current = new SceneManager();
		splatRef.current = new Splat(
			sceneManagerRef.current,
		);
		sceneManagerRef.current?.init(containerRef.current);
		sceneManagerRef.current?.addGraphic(
			splatRef.current,
		);
		setCameraProperty();
		(async function () {
			try {
				const data = await load(
					"/assets/model/converted_file.ksplat",
				);
				if (!data) return;
				splatRef.current?.add(data);
			} catch (e) {
				console.log(e);
			}
		})();
		return () => {
			sceneManagerRef.current?.dispose();
		};
	}, [load]);
	return {
		containerRef,
		switchHandle,
	};
}

export { useSceneHook };
