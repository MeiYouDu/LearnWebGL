import { merge } from "lodash";
import { Material, MaterialOptions, Texture } from "../baseMaterial";
import vert from "./cubeMap.vert";
import frag from "./cubeMap.frag";
import { GeometryInstance, PAttribPointer, Scene, Shader } from "../..";

interface CubeMapMaterialOptions extends MaterialOptions {
	/**
	 * 立方体贴图
	 */
	cubeMapTextures: Array<cubeMapTexture>;
}

interface cubeMapTexture extends Texture {
	image: string;
}

class CubeMapMaterial extends Material {
	constructor(options?: Partial<CubeMapMaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(vert, frag),
				vertexAttribPointer: PAttribPointer,
			},
			options,
		);
		super(mergedOptions);
		if (options?.cubeMapTextures && options.cubeMapTextures.length !== 6)
			throw new Error("cube map texture list length should be 6");
		this.cubeMapTextures = options?.cubeMapTextures;
	}

	protected texture?: WebGLTexture;

	protected cubeMapTextures?: CubeMapMaterialOptions["cubeMapTextures"];

	public remove(): this {
		const gl = this.getGl();
		if (!gl) return this;
		if (this.texture) {
			gl.deleteTexture(this.texture);
			this.texture = undefined;
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
		if (!this.cubeMapTextures) throw new Error("cubeMapTextures is required");
		this.texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + 11);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
		this.cubeMapTextures.forEach((item, index) => {
			const imgInstance = new Image(item.width, item.height);
			imgInstance.addEventListener("load", () => {
				gl.texImage2D(
					gl.TEXTURE_CUBE_MAP_POSITIVE_X + index,
					0,
					gl.RGBA,
					item.width,
					item.height,
					0,
					gl.RGBA,
					gl.UNSIGNED_BYTE,
					imgInstance,
				);
				gl.generateMipmap(gl.TEXTURE_2D);
				imgInstance.remove();
			});
			imgInstance.src = item.image;
		});
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
		this.setInt(11, "cubeMap");
	}

	public render(scene: Scene, instance: GeometryInstance): void {
		super.render(scene, instance);
		const gl = this.getGl();
		if (!gl) return;
		gl.activeTexture(gl.TEXTURE0 + 10);
		gl.bindTexture(gl.TEXTURE_2D, this.texture ?? null);
	}
}

export { CubeMapMaterial };

export type { CubeMapMaterialOptions, cubeMapTexture };
