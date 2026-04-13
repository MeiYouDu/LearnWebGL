import { merge } from "lodash";
import { Material, MaterialOptions } from "../baseMaterial";
import vert from "./postProcessing.vert";
import frag from "./postProcessing.frag";
import { postProcessingAttribPointer, Shader } from "../..";

class PostProcessingMaterial extends Material {
	constructor(options?: Partial<MaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(vert, frag),
				vertexAttribPointer: postProcessingAttribPointer,
			},
			options,
		);
		super(mergedOptions);
	}
}

export { PostProcessingMaterial };
