import { Material, MaterialOptions, PNTAttribPointer, Shader } from "@/helperv1";
import { merge } from "lodash";
import vert from "./depth.vert";
import frag from "./depth.frag";

class DepthMaterial extends Material {
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

export { DepthMaterial };
