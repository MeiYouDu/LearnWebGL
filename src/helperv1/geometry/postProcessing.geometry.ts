import { PostProcessingMaterial } from "../material";
import { Scene } from "../scene";
import { Geometry } from "./geometry";
import { GeometryInstance } from "./geometryInstance";

/**
 * 默认 attribute
 */
const attributes = new Float32Array([
	1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, -1.0, -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0,
	0.0, 0.0, 1.0, -1.0, 1.0, 0.0,
]);

/**
 * 后处理 geometry
 */
class PostProcessingGeometry extends Geometry {
	constructor() {
		super({
			attributes,
			material: new PostProcessingMaterial(),
		});
	}

	public render(scene: Scene, instance: GeometryInstance): void {
		const gl = this.getGl();
		if (!gl) return;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		super.render(scene, instance);
	}
}

class PostProcessingGeometryInstance extends GeometryInstance {
	constructor() {
		super({
			geometry: new PostProcessingGeometry(),
		});
	}
}

export { PostProcessingGeometry, PostProcessingGeometryInstance };
