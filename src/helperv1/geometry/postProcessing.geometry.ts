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
	public setScene(scene: Scene): void {
		super.setScene(scene);
		const gl = this.getGl();
		if (!gl) return;
		this.fbo = gl.createFramebuffer();
		this.rbo = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.rbo);
		gl.renderbufferStorage(
			gl.RENDERBUFFER,
			gl.DEPTH24_STENCIL8,
			gl.canvas.width,
			gl.canvas.height,
		);
		gl.framebufferRenderbuffer(
			gl.FRAMEBUFFER,
			gl.DEPTH_STENCIL_ATTACHMENT,
			gl.RENDERBUFFER,
			this.rbo,
		);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		const res = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (res !== gl.FRAMEBUFFER_COMPLETE) {
			console.error("framebuffer is not complete");
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
	}
	public bind() {
		const gl = this.getGl();
		if (!gl) return;
		if (this.fbo) {
			gl?.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		}
	}
	public render(scene: Scene, instance: GeometryInstance): void {
		const gl = this.getGl();
		if (!gl) return;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		super.render(scene, instance);
	}
	/**
	 * 帧缓冲
	 */
	private fbo?: WebGLFramebuffer;
	/**
	 * 渲染缓冲对象
	 */
	private rbo?: WebGLRenderbuffer;
}

class PostProcessingGeometryInstance extends GeometryInstance {
	constructor() {
		super({
			geometry: new PostProcessingGeometry(),
		});
	}
}

export { PostProcessingGeometry, PostProcessingGeometryInstance };
