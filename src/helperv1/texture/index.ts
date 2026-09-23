import { Base } from "../base";
import { Scene } from "../scene";

interface TextureOptions {
	/** 2D: 图片地址/ImageBitmap；CUBE_MAP: 6 张（+X -X +Y -Y +Z -Z） */
	image?: string | ImageBitmap | string[];
	/** 默认 "2D" */
	target?: "2D" | "CUBE_MAP";
	/** 程序化纹理（如 FBO 颜色附件、纯色兜底） */
	data?: {
		pixels: Uint8Array | null;
		width: number;
		height: number;
		internalFormat?: number;
		format?: number;
	};
	wrap?: { s: number; t: number };
	filter?: { min: number; mag: number };
	generateMipmap?: boolean;
}

/**
 * 纹理类
 *
 * 独立于材质，可被多个材质共享；同一实例只上传一次
 */
class Texture extends Base {
	constructor(options: TextureOptions) {
		super();
		this.options = options;
		this.target = options.target ?? "2D";
	}
	/**
	 * 原始 GL 纹理（postProcessingMaterial 挂 FBO 需要）
	 */
	public texture?: WebGLTexture;
	private options: TextureOptions;
	private target: "2D" | "CUBE_MAP";
	/**
	 * 图片上传完成后是否需要生成 mipmap
	 */
	private generateMipmap = false;

	/**
	 * 纹理目标映射到 gl 常量
	 */
	private getTarget(gl: WebGL2RenderingContext): number {
		return this.target === "CUBE_MAP" ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;
	}

	/**
	 * 图片尺寸（HTMLImageElement 用原始尺寸，避免受布局影响）
	 */
	private getImageSize(image: ImageBitmap | HTMLImageElement) {
		return image instanceof ImageBitmap
			? { width: image.width, height: image.height }
			: { width: image.naturalWidth, height: image.naturalHeight };
	}

	/**
	 * 创建并上传纹理
	 *
	 * 幂等：已创建直接返回；data 同步上传；string 走 new Image 异步加载；ImageBitmap 同步
	 */
	public setScene(scene: Scene): void {
		super.setScene(scene);
		if (this.texture) return;
		const gl = this.getGl();
		if (!gl) return;
		const target = this.getTarget(gl);
		const isCube = this.target === "CUBE_MAP";
		const isData = !!this.options.data;
		// 默认参数：2D 图片走 mipmap + REPEAT；程序化数据/CUBE_MAP 走 LINEAR
		const wrap = this.options.wrap ?? {
			s: isCube ? gl.CLAMP_TO_EDGE : gl.REPEAT,
			t: isCube ? gl.CLAMP_TO_EDGE : gl.REPEAT,
		};
		const filter = this.options.filter ?? {
			min: isCube || isData ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR,
			mag: gl.LINEAR,
		};
		this.generateMipmap = this.options.generateMipmap ?? (!isCube && !isData);
		this.texture = gl.createTexture() ?? undefined;
		gl.bindTexture(target, this.texture ?? null);
		gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap.s);
		gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap.t);
		// CUBE_MAP 采样方向包含 R 轴，跟随 S 轴设置
		if (isCube) gl.texParameteri(target, gl.TEXTURE_WRAP_R, wrap.s);
		gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filter.min);
		gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filter.mag);
		if (this.options.data) {
			const { pixels, width, height, internalFormat, format } = this.options.data;
			gl.texImage2D(
				target,
				0,
				internalFormat ?? gl.RGBA,
				width,
				height,
				0,
				format ?? gl.RGBA,
				gl.UNSIGNED_BYTE,
				pixels,
			);
			if (this.generateMipmap) gl.generateMipmap(target);
			return;
		}
		if (isCube) {
			this.uploadCubeMap(gl);
			return;
		}
		this.uploadImage2D(gl, target);
	}

	/**
	 * 上传 2D 图片：ImageBitmap 同步上传，字符串异步加载后上传
	 */
	private uploadImage2D(gl: WebGL2RenderingContext, target: number) {
		const image = this.options.image;
		if (!image) return;
		if (image instanceof ImageBitmap) {
			this.upload2DImage(gl, target, image);
			return;
		}
		if (typeof image !== "string") return;
		const imgInstance = new Image();
		imgInstance.addEventListener("load", () => {
			this.upload2DImage(gl, target, imgInstance);
			imgInstance.remove();
		});
		imgInstance.src = image;
	}

	private upload2DImage(
		gl: WebGL2RenderingContext,
		target: number,
		image: ImageBitmap | HTMLImageElement,
	) {
		const { width, height } = this.getImageSize(image);
		gl.bindTexture(target, this.texture ?? null);
		gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
		if (this.generateMipmap) gl.generateMipmap(target);
	}

	/**
	 * 上传 CUBE_MAP 6 个面（+X -X +Y -Y +Z -Z），每张图异步加载完立即上传该面
	 */
	private uploadCubeMap(gl: WebGL2RenderingContext) {
		const images = this.options.image;
		if (!Array.isArray(images)) return;
		images.forEach((src, index) => {
			const imgInstance = new Image();
			imgInstance.addEventListener("load", () => {
				if (!this.texture) return;
				const { width, height } = this.getImageSize(imgInstance);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
				gl.texImage2D(
					gl.TEXTURE_CUBE_MAP_POSITIVE_X + index,
					0,
					gl.RGBA,
					width,
					height,
					0,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					imgInstance,
				);
				imgInstance.remove();
			});
			imgInstance.src = src;
		});
	}

	/**
	 * 绑定到指定纹理单元
	 */
	public bind(gl: WebGL2RenderingContext, unit: number): void {
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(this.getTarget(gl), this.texture ?? null);
	}

	/**
	 * 从指定纹理单元解绑
	 */
	public unbind(gl: WebGL2RenderingContext, unit: number): void {
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(this.getTarget(gl), null);
	}

	/**
	 * 只删自己的 GL 纹理
	 */
	public remove(): this {
		const gl = this.getGl();
		if (gl && this.texture) {
			gl.deleteTexture(this.texture);
		}
		this.texture = undefined;
		return this;
	}
}

export { Texture };
export type { TextureOptions };
