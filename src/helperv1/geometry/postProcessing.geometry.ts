import { merge } from "lodash";
import { PostProcessingMaterial } from "../material";
import { postProcessingAttribPointer } from "../utils";
import { Geometry, GeometryOptions } from "./geometry";
import { GeometryInstance } from "./geometryInstance";

/**
 * 默认 attribute
 */
const attributes = new Float32Array([
	1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, -1.0, -1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0,
	0.0, 0.0, 1.0, -1.0, 1.0, 0.0,
]);

/**
 * 后处理 geometry
 */
class PostProcessingGeometry extends Geometry {
	constructor(options?: Partial<GeometryOptions>) {
		const mergedOptions = merge(
			{
				attributes,
				vertexAttribPointer: postProcessingAttribPointer,
			},
			options,
		);
		super(mergedOptions);
	}
}

class PostProcessingGeometryInstance extends GeometryInstance {
	constructor() {
		super({
			geometry: new PostProcessingGeometry(),
			material: new PostProcessingMaterial(),
		});
	}
}

export { PostProcessingGeometry, PostProcessingGeometryInstance };
