import { PostProcessingMaterial } from "../material";
import { Scene } from "../scene";
import { Geometry } from "./geometry";
import { GeometryInstance } from "./geometryInstance";

/**
 * 默认 attribute
 */
const attributes = new Float32Array([
	1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, -1.0, -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0,
	0.0, 0.0, 1.0, -1.0, 1.0, -1.0,
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
	public setScene(scene: Scene): void {
		super.setScene(scene);
		this.fbo = this.getGl()?.createFramebuffer();
	}
	public bind() {
		const gl = this.getGl();
		if (!gl) return;
		if (this.fbo) gl?.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
	}
	/**
	 * 帧缓冲
	 */
	private fbo?: WebGLFramebuffer;
}

class PostProcessingGeometryInstance extends GeometryInstance {
	constructor() {
		super({
			geometry: new PostProcessingGeometry(),
		});
	}
}

export { PostProcessingGeometry, PostProcessingGeometryInstance };
