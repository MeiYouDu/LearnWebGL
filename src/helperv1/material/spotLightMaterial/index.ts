import { merge } from "lodash";
import { Material, MaterialOptions } from "../baseMaterial";
import vert from "./spotLight.vert";
import frag from "./spotLight.frag";
import { PNTAttribPointer, Shader } from "../..";

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

export { SpotLightMaterial, vert as spotLightVert, frag as spotLightFrag };
