import { merge } from "lodash";
import { Scene, Shader } from "../..";
import { Texture } from "../../texture";
import { Material, MaterialOptions } from "../baseMaterial";
import blur from "./blur.frag";
import edge from "./edge.frag";
import gray from "./gray.frag";
import inversion from "./inversion.frag";
import frag from "./postProcessing.frag";
import vert from "./postProcessing.vert";
import sharpen from "./sharpen.frag";

class PostProcessingMaterial extends Material {
	constructor(options?: Partial<MaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(vert, frag),
			},
			options,
		);
		super(mergedOptions);
	}

	/**
	 * 帧缓冲颜色纹理
	 */
	private colorTexture?: Texture;
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

	/**
	 * 绘制前：切回默认帧缓冲并清屏
	 */
	public beforeDraw(scene: Scene, material: Material) {
		void scene;
		void material;
		const gl = this.getGl();
		if (!gl) return;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	public remove(): this {
		const gl = this.getGl();
		if (!gl) return this;
		if (this.fbo) {
			gl.deleteFramebuffer(this.fbo);
			this.fbo = undefined;
		}
		if (this.rbo) {
			gl.deleteRenderbuffer(this.rbo);
			this.rbo = undefined;
		}
		this.colorTexture?.remove();
		this.colorTexture = undefined;
		super.remove();
		// 恢复默认
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		return this;
	}

	public setScene(scene: Scene): void {
		const gl = scene.gl.deref();
		if (!gl) return;
		this.fbo = gl.createFramebuffer();
		this.rbo = gl.createRenderbuffer();
		const colorTexture = new Texture({
			data: {
				pixels: null,
				width: gl.canvas.width,
				height: gl.canvas.height,
				internalFormat: gl.RGB,
				format: gl.RGB,
			},
			filter: { min: gl.LINEAR, mag: gl.LINEAR },
			wrap: { s: gl.CLAMP_TO_EDGE, t: gl.CLAMP_TO_EDGE },
			generateMipmap: false,
		});
		this.colorTexture = colorTexture;
		this.textures = [{ texture: colorTexture, name: "postProcessingTexture", unit: 0 }];
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
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
		// 先上传颜色纹理，再挂到 FBO 上
		super.setScene(scene);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			colorTexture.texture ?? null,
			0,
		);
		const res = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (res !== gl.FRAMEBUFFER_COMPLETE) {
			console.error("framebuffer is not complete");
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
	}
}

export {
	blur as postProcessBlurFrag,
	frag as postProcessDefaultFrag,
	vert as postProcessDefaultVert,
	edge as postProcessEdgeFrag,
	gray as postProcessGrayFrag,
	PostProcessingMaterial,
	inversion as postProcessInversionFrag,
	sharpen as postProcessSharpenFrag,
};
