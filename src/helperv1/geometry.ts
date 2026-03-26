import { Base } from "./base.ts";
import { GeometryInstance } from "./geometryInstance.ts";
import { Material } from "./material/baseMaterial.ts";
import { BlinnPhongMaterial } from "./material/index.ts";
import { Scene } from "./scene.ts";

interface GeometryOptions {
	attributes: Float32Array;
	indices?: Uint32Array;
	material?: Material;
}

/**
 * 几何体类
 *
 * 关联 attribute、材质
 */
class Geometry extends Base {
	constructor(options: GeometryOptions) {
		super();
		this.attributes = options.attributes;
		this.indices = options.indices;
		this.material = options.material ?? new BlinnPhongMaterial();
	}
	private stride: number = 1;
	private vao?: WebGLVertexArrayObject;
	public readonly material: Required<GeometryOptions>["material"];
	public attributes: Float32Array;
	public indices?: Uint32Array;
	public setScene(scene: Scene): void {
		super.setScene(scene);
		// material.setScene内部会创建 shader program，并调用 shader.use
		this.material.setScene(scene);
		const gl = this.getGl();
		if (!gl) throw new Error("gl is undefined");
		/**
		 * 顶点缓冲对象
		 */
		const vbo = gl.createBuffer(),
			/**
			 * 索引
			 */
			ebo = gl.createBuffer();
		/**
		 * 顶点数组对象(顶点属性)
		 */
		this.vao = gl.createVertexArray();
		// 先绑定 vao，再绑定vbo 和 ebo
		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
		// 传递vbo数据
		gl.bufferData(gl.ARRAY_BUFFER, this.attributes, gl.STATIC_DRAW);
		// 确定 vertex attributes 解析方式，并确定间隔
		this.stride = this.material.vertexAttribPointer?.(gl, this.material) ?? 1;
		// 如果有 ebo 数据则传递
		if (this.indices) gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
	}
	public render(scene: Scene, instance: GeometryInstance) {
		if (!this.vao) return;
		const gl = scene.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		gl.bindVertexArray(this.vao);
		this.material.beforeDraw(scene, this.material);
		this.material.render(scene, instance);
		if (this.indices) {
			gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
		} else {
			gl.drawArrays(gl.TRIANGLES, 0, this.attributes.length / this.stride);
		}
		this.material.afterDraw(scene, this.material);
	}
}

export { Geometry };
