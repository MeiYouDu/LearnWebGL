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
	 * 绘制拓扑，默认三角形；子类可覆盖（如 PolylineGeometry 用 LINES）
	 */
	protected shapeType: GLenum = WebGL2RenderingContext.TRIANGLES;
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
		// 新建 VAO 属性未配置，必须失效 shader/stride 缓存，否则再次绘制会跳过 vertexAttribPointer
		this.lastShader = undefined;
		this.stride = 1;
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
	 * 每帧绑定自身 VAO，不依赖调用方的绑定顺序；
	 * 属性解析（location）延迟到绘制时、按当前 shader 配置，
	 * program 变化时才重新调用 vertexAttribPointer（同一 VAO 可被不同材质复用）
	 * @param gl
	 * @param shader 当前绘制使用的 shader
	 */
	public draw(gl: WebGL2RenderingContext, shader: Shader): void {
		if (!this.vao || !this.vbo) return;
		// 属性解析与绘制都作用于当前 VAO，统一在这里绑定
		gl.bindVertexArray(this.vao);
		if (this.lastShader !== shader) {
			this.stride = this.configureAttributes(gl, shader);
			this.lastShader = shader;
		}
		// 每帧上传动态数据（普通几何体无操作，实例化几何体在此更新实例矩阵）
		this.updateInstanceData(gl);
		this.drawCall(gl);
	}
	/**
	 * 配置顶点属性解析
	 *
	 * 默认绑定顶点 VBO 并调用构造时传入的 vertexAttribPointer；
	 * 子类可重写并在 super 之后追加自己的属性（如实例矩阵）
	 * @param gl
	 * @param shader
	 * @returns stride（顶点占用的 float 数）
	 */
	protected configureAttributes(gl: WebGL2RenderingContext, shader: Shader): number {
		if (!this.vbo) return 1;
		// vertexAttribPointer 记录的是调用时绑定在 GL_ARRAY_BUFFER 上的 buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		return this.vertexAttribPointer?.(gl, shader) ?? 1;
	}
	/**
	 * 每帧更新顶点/实例数据
	 *
	 * 默认无操作；实例化几何体在此上传实例矩阵
	 * @param gl
	 */
	protected updateInstanceData(gl: WebGL2RenderingContext): void {
		void gl;
	}
	/**
	 * 实际绘制调用
	 *
	 * 默认 drawElements / drawArrays；实例化几何体重写为 instanced 版本
	 * @param gl
	 */
	protected drawCall(gl: WebGL2RenderingContext): void {
		if (this.indices) {
			gl.drawElements(this.shapeType, this.indices.length, gl.UNSIGNED_INT, 0);
		} else {
			gl.drawArrays(this.shapeType, 0, this.attributes.length / this.stride);
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
