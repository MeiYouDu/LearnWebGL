import { merge } from "lodash";
import { Material, MaterialOptions } from "../baseMaterial";
import { Shader } from "@/helper/shader";
import vert from "./bilnnPhong.vert";
import frag from "./bilnnPhong.frag";
import { PNTAttribPointer } from "@/helper/utils";

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
