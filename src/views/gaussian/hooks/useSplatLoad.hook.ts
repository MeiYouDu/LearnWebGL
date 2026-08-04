import { ExtSplats, PackedSplats, SplatLoader } from "@sparkjsdev/spark";
import { useEffect, useRef } from "react";
import { LoadingManager } from "three";

interface ReturnType {
	load(url: string): Promise<ExtSplats | PackedSplats> | undefined;
}

function useSplatLoadHook(): ReturnType {
	const splatLoaderRef = useRef<SplatLoader>(null);
	function load(url: string) {
		return splatLoaderRef.current?.loadAsync(url);
	}
	useEffect(() => {
		splatLoaderRef.current = new SplatLoader(new LoadingManager());
		return () => {
			splatLoaderRef.current?.manager.abortController.abort("abort");
			splatLoaderRef.current = null;
		};
	}, []);
	return {
		load,
	};
}

export { useSplatLoadHook };
