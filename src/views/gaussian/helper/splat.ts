import { PackedSplats, SplatMesh } from "@sparkjsdev/spark";
import { SceneManager } from "@/views/gaussian/helper/sceneManager.ts";
import {
	BufferGeometry,
	Float32BufferAttribute,
	Mesh,
	MeshBasicMaterial,
	Points,
	PointsMaterial,
} from "three";
import { alphaFromColor } from "@/utils";
import {
	acceleratedRaycast,
	computeBoundsTree,
	disposeBoundsTree,
	MeshBVHHelper,
} from "three-mesh-bvh";

Mesh.prototype.raycast = acceleratedRaycast;
BufferGeometry.prototype.computeBoundsTree =
	computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree =
	disposeBoundsTree;

class Splat {
	constructor(sceneManager: SceneManager) {
		this.sceneManager = new WeakRef<SceneManager>(
			sceneManager,
		);
	}
	private sceneManager: WeakRef<SceneManager>;
	private points?: Points = new Points();
	private splatMesh?: SplatMesh = new SplatMesh();
	private BVHHelper?: MeshBVHHelper;
	private addPoints(data: PackedSplats) {
		if (!this.points) return;
		this.points.visible = true;
		this.points.material = new PointsMaterial({
			size: 0.01, // 像素大小，按需调整
			vertexColors: true,
			// sizeAttenuation: false,
			transparent: true,
		});
		const geometry = new BufferGeometry();
		const positions: number[] = [];
		const colors: number[] = [];
		let alpha: number;
		data.forEachSplat((...[, center, , , , color]) => {
			positions.push(center.x, center.y, center.z);
			alpha = alphaFromColor(color);
			colors.push(color.r, color.g, color.b, alpha);
		});
		geometry.setAttribute(
			"position",
			new Float32BufferAttribute(positions, 3),
		);
		geometry.setAttribute(
			"color",
			new Float32BufferAttribute(colors, 4),
		);
		this.points.geometry = geometry;
		this.sceneManager.deref()?.scene?.add(this.points);
		this.addBVH(geometry);
	}
	private addSplat(data: PackedSplats) {
		if (!this.splatMesh) return;
		this.splatMesh.visible = false;
		this.splatMesh.packedSplats = data;
		this.sceneManager
			.deref()
			?.scene?.add(this.splatMesh);
	}
	private addBVH(geometry: BufferGeometry) {
		const indices = [];
		const bvhGeometry = geometry.clone();
		const verticesLength =
			bvhGeometry.attributes.position.count;
		for (let i = 0, l = verticesLength; i < l; i++) {
			indices.push(i, i, i);
		}

		bvhGeometry.setIndex(indices);
		const bvhMaterial = new MeshBasicMaterial({
			color: 0xff0000,
		});
		const bvhMesh = new Mesh(bvhGeometry, bvhMaterial);
		this.BVHHelper = new MeshBVHHelper(bvhMesh, 15);
		this.BVHHelper.visible = true;
		// this.BVHHelper.displayParents = true;
		this.sceneManager
			.deref()
			?.scene?.add(bvhMesh, this.BVHHelper);
		// console.time("computeBoundsTree");
		// bvhMesh.geometry.computeBoundsTree();
		// console.timeEnd("computeBoundsTree");
		this.BVHHelper.update();
	}
	public add(data: PackedSplats) {
		this.addPoints(data);
		this.addSplat(data);
	}
	public setPointsVisible(visible: boolean) {
		if (!this.points) return;
		this.points.visible = visible;
	}
	public setSplatVisible(visible: boolean) {
		if (!this.splatMesh) return;
		this.splatMesh.visible = visible;
	}
	public dispose() {
		this.splatMesh?.dispose();
		this.points?.clear();
		this.BVHHelper?.clear();
		this.BVHHelper = undefined;
		this.points = undefined;
		this.splatMesh = undefined;
	}
	public render() {
		// this.BVHHelper?.update();
	}
}
export { Splat };
