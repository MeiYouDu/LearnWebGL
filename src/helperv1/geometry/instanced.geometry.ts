import type { mat4 } from "gl-matrix";
import type { Scene } from "../scene";
import type { Shader } from "../shader";
import type { GeometryOptions } from "./geometry";
import { Geometry } from "./geometry";

interface InstancedGeometryOptions extends GeometryOptions {
	/**
	 * 每个实例的世界矩阵，数量即实例数
	 */
	modelMatrices: mat4[];
	/**
	 * 实例矩阵 attribute 名，默认 instanceModel
	 */
	instanceMatrixAttribute?: string;
}

const MAT4_FLOAT_COUNT = 16;
const MAT4_BYTE_LENGTH = MAT4_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;
const COLUMN_BYTE_LENGTH = 4 * Float32Array.BYTES_PER_ELEMENT;

/**
 * 实例化几何体
 *
 * 顶点数据与普通 Geometry 相同，额外维护一个实例矩阵 VBO：
 * - 矩阵按 mat4 展开成 4 个 vec4 attribute，divisor = 1
 * - 实例数量直接取 modelMatrices.length
 * - 每帧 uploadInstanceMatrices，数量变化时重新分配 GPU buffer
 */
class InstancedGeometry extends Geometry {
	constructor(options: InstancedGeometryOptions) {
		super(options);
		this.modelMatrices = options.modelMatrices;
		this.instanceMatrixAttribute = options.instanceMatrixAttribute ?? "instanceModel";
	}
	/**
	 * 每个实例的世界矩阵，数量即实例数
	 */
	public modelMatrices: mat4[];
	/**
	 * 实例矩阵 attribute 名（mat4，占 4 个连续 location）
	 */
	public instanceMatrixAttribute: string;
	protected instanceMatrixVbo?: WebGLBuffer;
	private instanceMatrixCapacity = 0;
	private instanceMatrixData = new Float32Array(0);
	/**
	 * 实例数量，直接取矩阵数组长度
	 */
	public get instanceCount(): number {
		return this.modelMatrices.length;
	}
	public override setScene(scene: Scene): void {
		super.setScene(scene);
		const gl = this.getGl();
		if (!gl) throw new Error("gl is undefined");
		if (this.instanceMatrixVbo) {
			gl.deleteBuffer(this.instanceMatrixVbo);
		}
		this.instanceMatrixVbo = gl.createBuffer() ?? undefined;
		if (!this.instanceMatrixVbo) throw new Error("fail to create instance matrix buffer");
		this.instanceMatrixCapacity = 0;
		this.uploadInstanceMatrices(gl, true);
	}
	protected override configureAttributes(gl: WebGL2RenderingContext, shader: Shader): number {
		const stride = super.configureAttributes(gl, shader);
		this.configureInstanceMatrixPointer(gl, shader);
		return stride;
	}
	protected override updateInstanceData(gl: WebGL2RenderingContext): void {
		this.uploadInstanceMatrices(gl);
	}
	protected override drawCall(gl: WebGL2RenderingContext): void {
		const instanceCount = this.instanceCount;
		if (instanceCount <= 0) return;
		if (this.indices) {
			gl.drawElementsInstanced(
				this.shapeType,
				this.indices.length,
				gl.UNSIGNED_INT,
				0,
				instanceCount,
			);
		} else {
			gl.drawArraysInstanced(
				this.shapeType,
				0,
				this.attributes.length / this.stride,
				instanceCount,
			);
		}
	}
	public override remove(): this {
		const gl = this.getGl();
		const instanceMatrixVbo = this.instanceMatrixVbo;
		// 先让父类删除 VAO/VBO/EBO，再释放只属于实例化的矩阵 VBO
		super.remove();
		if (gl && instanceMatrixVbo) {
			gl.deleteBuffer(instanceMatrixVbo);
		}
		this.instanceMatrixVbo = undefined;
		this.instanceMatrixCapacity = 0;
		return this;
	}
	/**
	 * 配置实例矩阵的 4 列 attribute
	 *
	 * 调用时 ARRAY_BUFFER 绑定的是顶点 VBO，这里切换到实例矩阵 VBO；
	 * stride 为 64 字节，第 column 列偏移 column * 16 字节
	 */
	private configureInstanceMatrixPointer(gl: WebGL2RenderingContext, shader: Shader): void {
		if (!this.instanceMatrixVbo) throw new Error("instance matrix buffer is undefined");
		const location = this.getInstanceMatrixLocation(shader);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceMatrixVbo);
		for (let column = 0; column < 4; column += 1) {
			const columnLocation = location + column;
			gl.vertexAttribPointer(
				columnLocation,
				4,
				gl.FLOAT,
				false,
				MAT4_BYTE_LENGTH,
				column * COLUMN_BYTE_LENGTH,
			);
			gl.enableVertexAttribArray(columnLocation);
			// divisor = 1：每绘制一个实例才前进一次，而非每个顶点前进
			gl.vertexAttribDivisor(columnLocation, 1);
		}
	}
	/**
	 * 查询 mat4 attribute 的起始 location
	 *
	 * 部分实现只暴露 instanceModel[0]，因此先查基础名再查第一列
	 */
	private getInstanceMatrixLocation(shader: Shader): number {
		const direct = shader.getAttribLocation(this.instanceMatrixAttribute);
		if (typeof direct === "number" && direct >= 0) return direct;
		const firstColumn = shader.getAttribLocation(`${this.instanceMatrixAttribute}[0]`);
		if (typeof firstColumn === "number" && firstColumn >= 0) return firstColumn;
		throw new Error(
			`instanced attribute "${this.instanceMatrixAttribute}" not found in shader`,
		);
	}
	/**
	 * 上传实例矩阵
	 *
	 * 数量不变时 bufferSubData，数量变化时 bufferData 重新分配
	 * @param gl
	 * @param force 新建 VBO 后必须强制分配
	 */
	private uploadInstanceMatrices(gl: WebGL2RenderingContext, force = false): void {
		if (!this.instanceMatrixVbo) return;
		const count = this.modelMatrices.length;
		const requiredFloats = count * MAT4_FLOAT_COUNT;
		if (this.instanceMatrixData.length !== requiredFloats) {
			this.instanceMatrixData = new Float32Array(requiredFloats);
		}
		for (let index = 0; index < count; index += 1) {
			this.instanceMatrixData.set(this.modelMatrices[index], index * MAT4_FLOAT_COUNT);
		}
		const byteLength = requiredFloats * Float32Array.BYTES_PER_ELEMENT;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceMatrixVbo);
		if (byteLength > 0 && (force || this.instanceMatrixCapacity !== byteLength)) {
			gl.bufferData(gl.ARRAY_BUFFER, byteLength, gl.DYNAMIC_DRAW);
			this.instanceMatrixCapacity = byteLength;
		}
		if (byteLength > 0) {
			gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instanceMatrixData);
		}
	}
}

export { InstancedGeometry };
export type { InstancedGeometryOptions };
