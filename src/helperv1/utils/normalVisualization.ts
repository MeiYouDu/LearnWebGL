import { Geometry } from "../geometry/geometry";
import { PolylineGeometry } from "../geometry/polyline.geometry";
import { PNAttribPointer } from "./vertexAttribPointer";

interface NormalVisualizationOptions {
	/** 每个顶点的 float 数，例如 PN=6、PNT=8 */
	stride: number;
	/** position 在顶点内的 float 偏移，默认 0 */
	positionOffset?: number;
	/** normal 在顶点内的 float 偏移 */
	normalOffset: number;
	/** 法线线段长度，默认 0.1 */
	length?: number;
	/** 每隔多少个顶点取一个，默认 1 */
	step?: number;
}

/**
 * 把几何体的顶点法线展开成可绘制的线段
 *
 * 每个采样顶点生成一条线段：起点 p，终点 p + normalize(n) * length；
 * 两个端点都写入同一个 normal，便于 shader 按法线方向着色。
 * 只读取原始 attributes，不展开索引，避免共享顶点重复画线。
 */
function createNormalVisualization(
	geometry: Geometry,
	options: NormalVisualizationOptions,
): PolylineGeometry {
	const { stride, normalOffset, length = 0.1, step = 1 } = options;
	const positionOffset = options.positionOffset ?? 0;
	if (!Number.isInteger(stride) || stride <= 0) {
		throw new Error("stride must be a positive integer");
	}
	if (!Number.isInteger(positionOffset) || positionOffset < 0 || positionOffset + 3 > stride) {
		throw new Error("positionOffset + 3 must be within stride");
	}
	if (!Number.isInteger(normalOffset) || normalOffset < 0 || normalOffset + 3 > stride) {
		throw new Error("normalOffset + 3 must be within stride");
	}
	if (!Number.isFinite(length) || length <= 0) {
		throw new Error("length must be greater than 0");
	}
	if (!Number.isFinite(step) || step <= 0) {
		throw new Error("step must be greater than 0");
	}

	const sampleStep = Math.max(1, Math.floor(step));
	const attributes = geometry.attributes;
	const vertexCount = Math.floor(attributes.length / stride);
	const sampledCount = Math.ceil(vertexCount / sampleStep);
	// 每条线段 2 个顶点，每个顶点 position + normal 共 6 个 float
	const out = new Float32Array(sampledCount * 12);
	let write = 0;

	for (let i = 0; i < vertexCount; i += sampleStep) {
		const base = i * stride;
		const px = attributes[base + positionOffset];
		const py = attributes[base + positionOffset + 1];
		const pz = attributes[base + positionOffset + 2];
		const nx = attributes[base + normalOffset];
		const ny = attributes[base + normalOffset + 1];
		const nz = attributes[base + normalOffset + 2];
		const normalLength = Math.hypot(nx, ny, nz);
		// 零法线没有方向，跳过，避免归一化出 NaN
		if (normalLength === 0) continue;

		const scale = length / normalLength;
		const tx = px + nx * scale;
		const ty = py + ny * scale;
		const tz = pz + nz * scale;
		const unitX = nx / normalLength;
		const unitY = ny / normalLength;
		const unitZ = nz / normalLength;

		// 起点：position + normal
		out[write++] = px;
		out[write++] = py;
		out[write++] = pz;
		out[write++] = unitX;
		out[write++] = unitY;
		out[write++] = unitZ;

		// 终点：沿法线偏移后的 position + 同一 normal
		out[write++] = tx;
		out[write++] = ty;
		out[write++] = tz;
		out[write++] = unitX;
		out[write++] = unitY;
		out[write++] = unitZ;
	}

	return new PolylineGeometry({
		attributes: out.subarray(0, write),
		vertexAttribPointer: PNAttribPointer,
	});
}

export { createNormalVisualization };
export type { NormalVisualizationOptions };
