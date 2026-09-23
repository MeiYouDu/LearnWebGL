import { merge } from "lodash";
import { CubeMapMaterialOptions, Shader } from "../../";
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
			},
			options,
		);
		super(mergedOptions);
		if (options?.cubeMapTextures && options.cubeMapTextures.length !== 6)
			throw new Error("cube map texture list length should be 6");
		this.cubeMapTextures = options?.cubeMapTextures;
	}

	protected cubeMapTextures?: AmbientRefractMapMaterialOptions["cubeMapTextures"];
}
/**
 * 环境折射贴图
 */
class AmbientRefractMapMaterial extends CubeMapMaterial {
	constructor(options?: Partial<AmbientRefractMapMaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(ambientVert, refractFrag),
			},
			options,
		);
		super(mergedOptions);
		if (options?.cubeMapTextures && options.cubeMapTextures.length !== 6)
			throw new Error("cube map texture list length should be 6");
		this.cubeMapTextures = options?.cubeMapTextures;
	}

	protected cubeMapTextures?: AmbientRefractMapMaterialOptions["cubeMapTextures"];
}

export {
	AmbientReflectMapMaterial,
	AmbientRefractMapMaterial,
	ambientVert,
	reflectFrag,
	refractFrag,
};
