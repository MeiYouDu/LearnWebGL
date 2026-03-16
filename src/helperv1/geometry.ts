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
	private readonly material: Required<GeometryOptions>["material"];
	public attributes: Float32Array;
	public indices?: Uint32Array;
	public setScene(scene: Scene): void {
		super.setScene(scene);
		this.material.setScene(scene);
		const gl = this.getGl();
		if (!gl) throw new Error("gl is undefined");
		this.material.shader.use(gl);
		const vbo = gl.createBuffer(),
			ebo = gl.createBuffer();
		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
		// 传递数据
		gl.bufferData(gl.ARRAY_BUFFER, this.attributes, gl.STATIC_DRAW);
		if (this.indices) gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
	}
	public render(scene: Scene, instance: GeometryInstance) {
		if (!this.vao) return;
		const gl = scene.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		gl.bindVertexArray(this.vao);
		this.stride = this.material.render(scene, instance);
		if (this.indices) {
			gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
		} else {
			gl.drawArrays(gl.TRIANGLES, 0, this.attributes.length / this.stride);
		}
	}
}

export { Geometry };
