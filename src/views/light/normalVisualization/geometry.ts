/**
 * normalVisualization demo 专用几何体
 *
 * 参数化 UV 球体，position + normal + texCoord 交错（PNT，stride 8）。
 * 顶点按经纬网格共享：纬度方向 heightSegments + 1 圈、经度方向 widthSegments + 1 列，
 * 除了 UV 接缝与两极会复制顶点外，同一位置的顶点共用一条法线 —— 正好用来观察
 * 法线可视化工具对「共享顶点」几何体的表现。
 */

interface SphereOptions {
	/** 球半径 */
	radius?: number;
	/** 经度分段数 */
	widthSegments?: number;
	/** 纬度分段数 */
	heightSegments?: number;
}

interface GeometryData {
	attributes: Float32Array;
	indices: Uint32Array;
}

/**
 * 参数化球体（UV sphere）
 *
 * phi 从北极（0）到南极（PI），theta 绕 Y 轴一圈；
 * 法线等于单位球面上的点坐标，因此 position = normal * radius。
 */
function createSpherePNT({
	radius = 1,
	widthSegments = 32,
	heightSegments = 16,
}: SphereOptions = {}): GeometryData {
	const indices: number[] = [];
	const attributes = new Float32Array((widthSegments + 1) * (heightSegments + 1) * 8);

	let offset = 0;
	for (let y = 0; y <= heightSegments; y++) {
		const v = y / heightSegments;
		const phi = v * Math.PI;
		const sinPhi = Math.sin(phi);
		const cosPhi = Math.cos(phi);
		for (let x = 0; x <= widthSegments; x++) {
			const u = x / widthSegments;
			const theta = u * Math.PI * 2;
			const nx = sinPhi * Math.cos(theta);
			const ny = cosPhi;
			const nz = sinPhi * Math.sin(theta);
			attributes[offset++] = nx * radius;
			attributes[offset++] = ny * radius;
			attributes[offset++] = nz * radius;
			attributes[offset++] = nx;
			attributes[offset++] = ny;
			attributes[offset++] = nz;
			attributes[offset++] = u;
			attributes[offset++] = 1 - v;
		}
	}

	for (let y = 0; y < heightSegments; y++) {
		for (let x = 0; x < widthSegments; x++) {
			const a = y * (widthSegments + 1) + x;
			const b = a + widthSegments + 1;
			// 极点处的三角形退化成一点，跳过
			if (y !== 0) indices.push(a, a + 1, b);
			if (y !== heightSegments - 1) indices.push(b, a + 1, b + 1);
		}
	}

	return {
		attributes,
		indices: new Uint32Array(indices),
	};
}

export { createSpherePNT };
export type { SphereOptions };
