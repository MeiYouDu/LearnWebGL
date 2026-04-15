import { merge } from "lodash";
import { Material, MaterialOptions } from "../baseMaterial";
import vert from "./postProcessing.vert";
import frag from "./postProcessing.frag";
import { GeometryInstance, postProcessingAttribPointer, Scene, Shader } from "../..";

class PostProcessingMaterial extends Material {
	constructor(options?: Partial<MaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(vert, frag),
				vertexAttribPointer: postProcessingAttribPointer,
			},
			options,
		);
		super(mergedOptions);
	}

	private texture?: WebGLTexture;
	/**
	 * 帧缓冲
	 */
	private fbo?: WebGLFramebuffer;
	/**
	 * 渲染缓冲对象
	 */
	private rbo?: WebGLRenderbuffer;
	public bind() {
		const gl = this.getGl();
		if (!gl) return;
		if (this.fbo) {
			gl?.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		}
	}

	public setScene(scene: Scene): void {
		super.setScene(scene);
		const gl = this.getGl();
		if (!gl) return;
		this.fbo = gl.createFramebuffer();
		this.rbo = gl.createRenderbuffer();
		this.bind();
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
		this.texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + 10);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.canvas.width,
			gl.canvas.height,
			0,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			null,
		);
		this.setTextureParams(gl);
		this.setInt(10, "postProcessingTexture");
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			this.texture,
			0,
		);
	}

	public render(scene: Scene, instance: GeometryInstance): void {
		super.render(scene, instance);
		const gl = this.getGl();
		if (!gl) return;
		gl.activeTexture(gl.TEXTURE0 + 10);
		gl.bindTexture(gl.TEXTURE_2D, this.texture ?? null);
	}
}

export { PostProcessingMaterial };
