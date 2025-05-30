import { Scene } from "./scene.ts";
import { GeometryInstance } from "./geometryInstance.ts";
import { Shader } from "./shader.ts";
import { vec2 } from "gl-matrix";

interface GeometryOptions {
	attributes: Float32Array;
	shader: Shader;
	/**
	 * attribute解析方式
	 * @param gl
	 */
	vertexAttribPointer?(
		gl: WebGL2RenderingContext,
		shader: Shader,
	): number;

	/**
	 * 每一帧都会调用
	 * @param gl
	 * @param shader
	 */
	uniformsSetter?(
		gl: WebGL2RenderingContext,
		shader: Shader,
	): void;
	indices?: Uint32Array;
	texture?: Array<{
		image: string;
		width: number;
		height: number;
		textureUnit: number;
		textureLocationName?: string;
	}>;
}

/**
 * 几何体类
 */
class Geometry {
	constructor(options: GeometryOptions) {
		this.attributes = options.attributes;
		this.indices = options.indices;
		this.shader = options.shader;
		this.vertexAttribPointer = options.vertexAttribPointer;
		const gl = this.shader.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		this.shader.use();
		const vbo = gl.createBuffer(),
			ebo = gl.createBuffer();
		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
		// 传递数据
		gl.bufferData(
			gl.ARRAY_BUFFER,
			this.attributes,
			gl.STATIC_DRAW,
		);
		if (this.indices)
			gl.bufferData(
				gl.ELEMENT_ARRAY_BUFFER,
				this.indices,
				gl.STATIC_DRAW,
			);
		options.texture?.forEach((texture, index) => {
			this.resolveTexture(
				gl,
				this.shader,
				texture.image,
				texture.width,
				texture.height,
				index,
			);
		});
		if (options.vertexAttribPointer)
			this.stride = options.vertexAttribPointer(
				gl,
				this.shader,
			);
		this.uniformsSetter = options.uniformsSetter;
	}
	public attributes: Float32Array;
	public indices?: Uint32Array;
	public shader: Shader;
	public uniformsSetter: GeometryOptions["uniformsSetter"];
	public vertexAttribPointer: GeometryOptions["vertexAttribPointer"];
	public render(scene: Scene, instance: GeometryInstance) {
		const gl = scene.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		this.shader.use();
		gl.bindVertexArray(this.vao);
		this.uniformsSetter?.(gl, this.shader);
		this.shader.setVec2(
			vec2.fromValues(gl.canvas.width, gl.canvas.height),
			"resolution",
		);
		this.shader.setMatrix4(instance.matrix, "model");
		this.shader.setMatrix4(scene.camera.viewMatrix, "view");
		this.shader.setMatrix4(
			scene.camera.projectionMatrix,
			"projection",
		);
		if (this.indices) {
			gl.drawElements(
				gl.TRIANGLES,
				this.indices.length,
				gl.UNSIGNED_BYTE,
				0,
			);
		} else {
			gl.drawArrays(
				gl.TRIANGLES,
				0,
				this.attributes.length / this.stride,
			);
		}
	}
	private readonly vao: WebGLVertexArrayObject;
	private readonly stride: number = 1;
	private setTextureParams(gl: WebGL2RenderingContext) {
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_S,
			gl.REPEAT,
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_T,
			gl.REPEAT,
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			gl.LINEAR_MIPMAP_LINEAR,
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MAG_FILTER,
			gl.LINEAR,
		);
	}
	private resolveTexture(
		gl: WebGL2RenderingContext,
		shaderInstance: Shader,
		image: string,
		width: number,
		height: number,
		textureUnit: number,
		textureLocationName?: string,
	) {
		const imgInstance = new Image(width, height);
		imgInstance.addEventListener("load", () => {
			shaderInstance.use();
			const texture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0 + textureUnit);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			shaderInstance.setInt(
				textureUnit,
				textureLocationName || `texture${textureUnit}`,
			);
			this.setTextureParams(gl);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				width,
				height,
				0,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				imgInstance,
			);
			gl.generateMipmap(gl.TEXTURE_2D);
			imgInstance.remove();
		});
		imgInstance.src = image;
	}
}

export { Geometry };
