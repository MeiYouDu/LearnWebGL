import { merge } from "lodash";
import { Shader } from "../../shader";
import { Material, MaterialOptions } from "../baseMaterial";
import { blinnPhongFrag } from "../blinnPhongMaterial";
import vert from "./instancedBlinnPhong.vert";

/**
 * 实例化 Blinn-Phong 材质
 *
 * 顶点着色器用 instanceModel 代替 model，片元着色器复用 blinnPhong.frag；
 * 实例矩阵是世界空间最终矩阵，因此不再乘 GeometryInstance.matrix
 */
class InstancedBlinnPhongMaterial extends Material {
	constructor(options?: Partial<MaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(vert, blinnPhongFrag),
			},
			options,
		);
		super(mergedOptions);
	}
}

export { InstancedBlinnPhongMaterial, vert as instancedBlinnPhongVert };
