import { merge } from "lodash";
import { Material, MaterialOptions } from "../baseMaterial";
import vert from "./postProcessing.vert";
import frag from "./postProcessing.frag";
import inversion from "./inversion.frag";
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

	public remove(): this {
		const gl = this.getGl();
		if (!gl) return this;
		if (this.texture) {
			gl.deleteTexture(this.texture);
			this.texture = undefined;
		}
		if (this.fbo) {
			gl.deleteFramebuffer(this.fbo);
			this.fbo = undefined;
		}
		if (this.rbo) {
			gl.deleteRenderbuffer(this.rbo);
			this.rbo = undefined;
		}
		super.remove();
		// 恢复默认
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		return this;
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
		/**
		 *  缺失的多级渐远纹理（Mipmaps）当你渲染场景到 Framebuffer 的纹理时，你只是在往该纹理的 Level 0（原始大小）写入数据。LINEAR_MIPMAP_LINEAR 告诉 WebGL：“请根据物体距离，在多层不同尺寸的贴图之间进行线性插值。”但是，你并没有调用 gl.generateMipmap(gl.TEXTURE_2D)。结果：WebGL 发现除了 Level 0 以外，其他的 Level 1, Level 2... 全是空的。它认为这个纹理是“不完整的”，为了安全起见，采样结果直接返回 (0, 0, 0, 1) 透明黑。2. 非 2 的幂限制 (仅限 WebGL 1.0)如果你的画布尺寸（比如 1920x1080）不是 $2^n$（如 1024 或 2048）：在 WebGL 1.0 中，非 2 幂（NPOT）纹理严禁生成和使用 Mipmaps。一旦你开启了 Mipmap 过滤，WebGL 会立即判定该纹理无效。
		 */
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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

export {
	PostProcessingMaterial,
	vert as postProcessDefaultVert,
	frag as postProcessDefaultFrag,
	inversion as postProcessInversionFrag,
};
