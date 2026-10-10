/**
 * quaternion 教学 demo 专用几何体
 *
 * 引擎的 Geometry 只绘制 gl.TRIANGLES（见 helperv1/geometry/geometry.ts），无法画线框，
 * 因此万向节的圆环用三角形网格的圆环面实现，而不是圆环线。
 * 所有几何体均为 position + normal 交错（PN，stride 6），由 PNAttribPointer 解析。
 */

interface TorusOptions {
	/** 圆环大半径（环心到管心的距离） */
	radius: number;
	/** 管半径（环的粗细） */
	tube: number;
	/** 大圆周分段数 */
	segments?: number;
	/** 管截面分段数 */
	tubeSegments?: number;
}

interface GeometryData {
	attributes: Float32Array;
	indices?: Uint32Array;
}

/**
 * 参数化圆环面（torus）
 *
 * 初始位于 XY 平面、法线朝 +Z，便于用 base 旋转矩阵把环摆到万向节的各个方向。
 * 返回 position + normal 交错数组（stride 6）与 Uint32Array 索引（TRIANGLES）。
 */
function createTorus({
	radius,
	tube,
	segments = 64,
	tubeSegments = 16,
}: TorusOptions): GeometryData {
	const rawPositions: number[] = [];
	const rawNormals: number[] = [];
	const indices: number[] = [];

	// 大圆参数 u 沿 XY 平面展开，管截面参数 v 在「径向 + Z 轴」张成的平面内
	for (let i = 0; i <= segments; i++) {
		const u = (i / segments) * Math.PI * 2;
		const cosU = Math.cos(u);
		const sinU = Math.sin(u);
		for (let j = 0; j <= tubeSegments; j++) {
			const v = (j / tubeSegments) * Math.PI * 2;
			const cosV = Math.cos(v);
			const sinV = Math.sin(v);
			const ringRadius = radius + tube * cosV;
			rawPositions.push(ringRadius * cosU, ringRadius * sinU, tube * sinV);
			rawNormals.push(cosV * cosU, cosV * sinU, sinV);
		}
	}

	// 相邻两条大圆线之间连成三角形条带
	for (let i = 0; i < segments; i++) {
		for (let j = 0; j < tubeSegments; j++) {
			const a = i * (tubeSegments + 1) + j;
			const b = (i + 1) * (tubeSegments + 1) + j;
			indices.push(a, b, a + 1, b, b + 1, a + 1);
		}
	}

	return {
		attributes: interleavePN(rawPositions, rawNormals),
		indices: new Uint32Array(indices),
	};
}

/**
 * 单位立方体 PN 几何（范围 [-0.5, 0.5]）
 *
 * 供三色坐标轴细棒复用：每条轴一个实例，各自用矩阵缩放成细长条并给不同颜色。
 */
function createBoxPN(): GeometryData {
	const h = 0.5;
	// 每个面：法线 + 4 个角点（逆时针）
	const faces: Array<{ normal: number[]; quad: number[][] }> = [
		{
			normal: [1, 0, 0],
			quad: [
				[h, -h, h],
				[h, -h, -h],
				[h, h, -h],
				[h, h, h],
			],
		},
		{
			normal: [-1, 0, 0],
			quad: [
				[-h, -h, -h],
				[-h, -h, h],
				[-h, h, h],
				[-h, h, -h],
			],
		},
		{
			normal: [0, 1, 0],
			quad: [
				[-h, h, h],
				[h, h, h],
				[h, h, -h],
				[-h, h, -h],
			],
		},
		{
			normal: [0, -1, 0],
			quad: [
				[-h, -h, -h],
				[h, -h, -h],
				[h, -h, h],
				[-h, -h, h],
			],
		},
		{
			normal: [0, 0, 1],
			quad: [
				[-h, -h, h],
				[h, -h, h],
				[h, h, h],
				[-h, h, h],
			],
		},
		{
			normal: [0, 0, -1],
			quad: [
				[h, -h, -h],
				[-h, -h, -h],
				[-h, h, -h],
				[h, h, -h],
			],
		},
	];
	const rawPositions: number[] = [];
	const rawNormals: number[] = [];
	faces.forEach(({ normal, quad }) => {
		// 四边形按 0-1-2 / 0-2-3 拆成两个三角形
		[0, 1, 2, 0, 2, 3].forEach((index) => {
			const [x, y, z] = quad[index];
			rawPositions.push(x, y, z);
			rawNormals.push(normal[0], normal[1], normal[2]);
		});
	});
	return { attributes: interleavePN(rawPositions, rawNormals) };
}

/**
 * 把分离的 position / normal 交错成 stride 6 的 Float32Array（PN）
 */
function interleavePN(positions: number[], normals: number[]): Float32Array {
	const vertexCount = positions.length / 3;
	const attributes = new Float32Array(vertexCount * 6);
	for (let i = 0; i < vertexCount; i++) {
		attributes[i * 6 + 0] = positions[i * 3 + 0];
		attributes[i * 6 + 1] = positions[i * 3 + 1];
		attributes[i * 6 + 2] = positions[i * 3 + 2];
		attributes[i * 6 + 3] = normals[i * 3 + 0];
		attributes[i * 6 + 4] = normals[i * 3 + 1];
		attributes[i * 6 + 5] = normals[i * 3 + 2];
	}
	return attributes;
}

export { createBoxPN, createTorus };
export type { GeometryData };
