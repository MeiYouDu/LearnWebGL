import { PAttribPointer } from "../utils/vertexAttribPointer";
import { Geometry, GeometryOptions } from "./geometry";

/**
 * 折线几何体
 *
 * 默认拓扑为 LINES：每两个顶点组成一条独立线段。
 * 连续折线可在子类里覆盖 shapeType 为 LINE_STRIP。
 */
class PolylineGeometry extends Geometry {
	protected override shapeType: GLenum = WebGL2RenderingContext.LINES;

	constructor(options: GeometryOptions) {
		super({
			...options,
			vertexAttribPointer: options.vertexAttribPointer ?? PAttribPointer,
		});
	}
}

export { PolylineGeometry };
