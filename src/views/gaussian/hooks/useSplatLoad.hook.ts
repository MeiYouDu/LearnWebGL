import { RefObject, useEffect, useRef } from "react";
import { SplatLoader, SplatMesh } from "@sparkjsdev/spark";
import {
	BufferGeometry,
	BufferGeometryEventMap,
	Float32BufferAttribute,
	LoadingManager,
	Material,
	MathUtils,
	NormalBufferAttributes,
	Object3DEventMap,
	Points,
	PointsMaterial,
	Quaternion,
	Vector3,
} from "three";
import { alphaFromColor } from "@/utils";

interface ReturnType {
	splatMeshRef: RefObject<SplatMesh | null>;
	pointsRef: RefObject<Points<
		BufferGeometry<
			NormalBufferAttributes,
			BufferGeometryEventMap
		>,
		Material | Material[],
		Object3DEventMap
	> | null>;
}

function useSplatLoadHook(url: string): ReturnType {
	const splatMeshRef = useRef<SplatMesh>(null);
	const splatLoaderRef = useRef<SplatLoader>(null);
	const pointsRef = useRef<Points>(null);
	useEffect(() => {
		splatLoaderRef.current = new SplatLoader(
			new LoadingManager(),
		);
		splatMeshRef.current = new SplatMesh();
		pointsRef.current = new Points();
		pointsRef.current.material = new PointsMaterial({
			size: 0.01, // 像素大小，按需调整
			vertexColors: true,
			// sizeAttenuation: false,
			transparent: true,
		});
		(async function () {
			if (!splatMeshRef.current || !pointsRef.current)
				return;
			const packedSplats =
				await splatLoaderRef.current?.loadAsync(
					url,
				);
			if (!packedSplats) return;
			splatMeshRef.current.packedSplats =
				packedSplats;
			const geometry = new BufferGeometry();
			const positions: number[] = [];
			const colors: number[] = [];
			let alpha: number;
			packedSplats.forEachSplat(
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
			pointsRef.current.geometry = geometry;
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
		})();
		return () => {
			splatLoaderRef.current?.abort();
			splatLoaderRef.current = null;
			splatMeshRef.current?.dispose();
			splatMeshRef.current = null;
			pointsRef.current?.clear();
			pointsRef.current = null;
		};
	}, [url]);
	return {
		splatMeshRef,
		pointsRef,
	};
}

export { useSplatLoadHook };
