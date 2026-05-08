import { merge } from "lodash";
import { PNTAttribPointer, Shader } from "../..";
import { Material, MaterialOptions } from "../baseMaterial";
import frag from "./spotLight.frag";
import vert from "./spotLight.vert";

class SpotLightMaterial extends Material {
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

export { frag as spotLightFrag, SpotLightMaterial, vert as spotLightVert };
