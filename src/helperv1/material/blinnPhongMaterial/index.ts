import { merge } from "lodash";
import { Material, MaterialOptions } from "../baseMaterial";
import vert from "./bilnnPhong.vert";
import frag from "./blinnPhong.frag";
import { PNTAttribPointer, Shader } from "../..";

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

export { BlinnPhongMaterial };
