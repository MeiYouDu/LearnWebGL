import { merge } from "lodash";
import { PNTAttribPointer, Shader } from "../..";
import { Material, MaterialOptions } from "../baseMaterial";
import frag from "./blinnPhong.frag";
import vert from "./blinnPhong.vert";

class BlinnPhongMaterial extends Material {
	constructor(options?: Partial<MaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(vert, frag),
				vertexAttribPointer: PNTAttribPointer,
			},
			options,
		);
		super(mergedOptions);
	}
}

export { frag as blinnPhongFrag, BlinnPhongMaterial, vert as blinnPhongVert };
