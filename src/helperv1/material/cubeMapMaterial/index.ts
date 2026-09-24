import { merge } from "lodash";
import { Shader } from "../..";
import { Texture } from "../../texture";
import { Material, MaterialOptions } from "../baseMaterial";
import frag from "./cubeMap.frag";
import vert from "./cubeMap.vert";

interface CubeMapMaterialOptions extends MaterialOptions {
	/**
	 * 立方体贴图
	 */
	cubeMapTextures: Array<cubeMapTexture>;
}

interface cubeMapTexture {
	/**
	 * 图片地址
	 */
	image: string;
}

class CubeMapMaterial extends Material {
	constructor(options?: Partial<CubeMapMaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(vert, frag),
			},
			options,
		);
		super(mergedOptions);
		if (options?.cubeMapTextures && options.cubeMapTextures.length !== 6)
			throw new Error("cube map texture list length should be 6");
		this.cubeMapTextures = options?.cubeMapTextures;
		// 6 张面统一转换成 Texture，纹理上传/绑定由 Texture 负责
		if (this.cubeMapTextures) {
			this.cubeMapTexture = new Texture({
				target: "CUBE_MAP",
				image: this.cubeMapTextures.map((item) => item.image),
			});
			this.textures = [{ texture: this.cubeMapTexture, name: "cubeMap", unit: 1 }];
		}
	}

	protected cubeMapTextures?: CubeMapMaterialOptions["cubeMapTextures"];
	/**
	 * 构造时自建的立方体贴图纹理，属于材质自身资源
	 */
	private cubeMapTexture?: Texture;

	public remove() {
		// 立方体贴图是材质自建资源，随材质一起释放；
		// 外部传入的 this.textures 生命周期归创建方，不在此处理。
		this.cubeMapTexture?.remove();
		this.cubeMapTexture = undefined;
		return super.remove();
	}
}

export { frag as CubeMapFrag, CubeMapMaterial, vert as CubeMapVert };

export type { CubeMapMaterialOptions, cubeMapTexture };
