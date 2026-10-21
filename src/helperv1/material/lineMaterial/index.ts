import { vec3 } from "gl-matrix";
import { merge } from "lodash";
import { Shader } from "../../shader";
import { Material, MaterialOptions } from "../baseMaterial";
import frag from "./line.frag";
import vert from "./line.vert";

interface LineMaterialOptions extends Partial<MaterialOptions> {
	/** 线段颜色，默认橙色；useNormalColor 为 true 时忽略 */
	color?: vec3;
	/** 按法线方向着色，默认 false */
	normalColor?: boolean;
}

/**
 * 无光照线材质
 *
 * 使用 position + normal 两个 attribute；
 * normalColor 为 true 时把法线映射到 RGB，便于观察方向。
 */
class LineMaterial extends Material {
	constructor(options: LineMaterialOptions = {}) {
		const {
			color = vec3.fromValues(1.0, 0.5, 0.0),
			normalColor = false,
			...materialOptions
		} = options;
		super(merge({ shader: new Shader(vert, frag) }, materialOptions));
		this.color = color;
		this.normalColor = normalColor;
		const uniformsSetter = this.uniformsSetter;
		this.uniformsSetter = (gl, material) => {
			material.setVec3(this.color, "color");
			material.setInt(this.normalColor ? 1 : 0, "useNormalColor");
			uniformsSetter?.(gl, material);
		};
	}

	public color: vec3;
	public normalColor: boolean;
}

export { LineMaterial };
export type { LineMaterialOptions };
