import { merge } from "lodash";
import { CubeMapMaterialOptions, PNTAttribPointer, Shader } from "../../";
import { Material } from "../baseMaterial";
import { CubeMapMaterial } from "../cubeMapMaterial";
import ambientVert from "./ambientMap.vert";
import reflectFrag from "./reflect.frag";
import refractFrag from "./refract.frag";

/**
 * 反射
 */
// interface AmbientReflectMapMaterialOptions extends CubeMapMaterialOptions {}

/**
 * 折射
 */
interface AmbientRefractMapMaterialOptions extends CubeMapMaterialOptions {
	refractiveRadio: number;
}
/**
 * 环境反射贴图
 */
class AmbientReflectMapMaterial extends CubeMapMaterial {
	constructor(options?: Partial<AmbientRefractMapMaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(ambientVert, reflectFrag),
				vertexAttribPointer: PNTAttribPointer,
			},
			options,
		);
		super(mergedOptions);
		if (options?.cubeMapTextures && options.cubeMapTextures.length !== 6)
			throw new Error("cube map texture list length should be 6");
		this.cubeMapTextures = options?.cubeMapTextures;
	}

	protected texture?: WebGLTexture;

	protected cubeMapTextures?: AmbientRefractMapMaterialOptions["cubeMapTextures"];

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
}
/**
 * 环境折射贴图
 */
class AmbientRefractMapMaterial extends Material {
	constructor(options?: Partial<AmbientRefractMapMaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(ambientVert, refractFrag),
				vertexAttribPointer: PNTAttribPointer,
			},
			options,
		);
		super(mergedOptions);
		if (options?.cubeMapTextures && options.cubeMapTextures.length !== 6)
			throw new Error("cube map texture list length should be 6");
		this.cubeMapTextures = options?.cubeMapTextures;
	}

	protected texture?: WebGLTexture;

	protected cubeMapTextures?: AmbientRefractMapMaterialOptions["cubeMapTextures"];

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
}

export {
	AmbientReflectMapMaterial,
	AmbientRefractMapMaterial,
	ambientVert,
	reflectFrag,
	refractFrag,
};
