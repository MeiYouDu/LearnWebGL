import { Base } from "../base.ts";
import { Scene } from "../scene.ts";
import { Shader } from "../shader.ts";

interface GeometryOptions {
	attributes: Float32Array;
	indices?: Uint32Array;
	/**
	 * attribute解析方式
	 * @param gl
	 * @param shader
	 */
	vertexAttribPointer?(gl: WebGL2RenderingContext, shader: Shader): number;
}

/**
 * 几何体类
 *
 * 关联 attribute
 */
class Geometry extends Base {
	constructor(options: GeometryOptions) {
		super();
		this.attributes = options.attributes;
		this.indices = options.indices;
		this.vertexAttribPointer = options.vertexAttribPointer;
	}
	protected stride: number = 1;
	/**
	 * 上次配置属性解析用的 shader（program 变化时才需要重新配置 VAO）
	 */
	protected lastShader?: Shader;
	protected vao?: WebGLVertexArrayObject;
	protected vbo?: WebGLBuffer;
	protected ebo?: WebGLBuffer;
	public attributes: Float32Array;
	public indices?: Uint32Array;
	public vertexAttribPointer: GeometryOptions["vertexAttribPointer"];
	public setScene(scene: Scene): void {
		super.setScene(scene);
		const gl = this.getGl();
		if (!gl) throw new Error("gl is undefined");
		/**
		 * 顶点缓冲对象
		 */
		this.vbo = gl.createBuffer();
		/**
		 * 索引
		 */
		this.ebo = gl.createBuffer();
		/**
		 * 顶点数组对象(顶点属性)
		 */
		this.vao = gl.createVertexArray();
		// 先绑定 vao，再绑定vbo 和 ebo
		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
		// 传递vbo数据
		gl.bufferData(gl.ARRAY_BUFFER, this.attributes, gl.STATIC_DRAW);
		// 如果有 ebo 数据则传递
		if (this.indices) gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
	}
	/**
	 * 绑定 vao
	 * @param gl
	 */
	public bind(gl: WebGL2RenderingContext): void {
		if (!this.vao) return;
		gl.bindVertexArray(this.vao);
	}
	/**
	 * 绘制
	 *
	 * 属性解析（location）延迟到绘制时、按当前 shader 配置；
	 * program 变化时才重新调用 vertexAttribPointer（同一 VAO 可被不同材质复用）
	 * @param gl
	 * @param shader 当前绘制使用的 shader
	 */
	public draw(gl: WebGL2RenderingContext, shader: Shader): void {
		if (!this.vao || !this.vbo) return;
		if (this.lastShader !== shader) {
			// vertexAttribPointer 记录的是调用时绑定在 GL_ARRAY_BUFFER 上的 buffer
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
			this.stride = this.vertexAttribPointer?.(gl, shader) ?? 1;
			this.lastShader = shader;
		}
		if (this.indices) {
			gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
		} else {
			gl.drawArrays(gl.TRIANGLES, 0, this.attributes.length / this.stride);
		}
	}
	public remove() {
		const gl = this.getGl();
		if (!gl) return this;
		if (this.vao) {
			gl.deleteVertexArray(this.vao);
			this.vao = undefined;
		}
		if (this.vbo) {
			gl.deleteBuffer(this.vbo);
			this.vbo = undefined;
		}
		if (this.ebo) {
			gl.deleteBuffer(this.ebo);
			this.ebo = undefined;
		}
		return this;
	}
}

export { Geometry };
export type { GeometryOptions };
