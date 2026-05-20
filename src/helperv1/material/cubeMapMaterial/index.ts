import { merge } from "lodash";
import { PAttribPointer, Scene, Shader } from "../..";
import { Material, MaterialOptions, Texture } from "../baseMaterial";
import frag from "./cubeMap.frag";
import vert from "./cubeMap.vert";

interface CubeMapMaterialOptions extends MaterialOptions {
	/**
	 * 立方体贴图
	 */
	cubeMapTextures: Array<CubeMapTexture>;
}

type CubeMapTexture = Omit<cubeMapTexture, "textureUnit">;

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
		gl.activeTexture(gl.TEXTURE0 + 1);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
		this.setInt(1, "cubeMap");
		this.cubeMapTextures.forEach((item, index) => {
			const imgInstance = new Image(item.width, item.height);
			imgInstance.addEventListener("load", () => {
				if (!this.texture) return;
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture as WebGLTexture);
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
				imgInstance.remove();
			});
			imgInstance.src = item.image;
		});
		this.textureInstances[1] = {
			texture: this.texture,
			type: gl.TEXTURE_CUBE_MAP,
		};
		// gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	}

	// public render(scene: Scene, instance: GeometryInstance): void {
	// 	super.render(scene, instance);
	// 	const gl = this.getGl();
	// 	if (!gl) return;
	// 	gl.activeTexture(gl.TEXTURE0);
	// 	gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture ?? null);
	// }
}

export { frag as CubeMapFrag, CubeMapMaterial, vert as CubeMapVert };

export type { CubeMapMaterialOptions, cubeMapTexture };
