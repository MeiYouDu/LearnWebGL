import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { GeometryInstance } from "../geometryInstance";
import { Scene } from "../scene";
import { Shader } from "../shader";
import { Base } from "../base";

interface Texture {
	image: string;
	width: number;
	height: number;
	textureUnit: number;
	textureLocationName?: string;
}

interface MaterialOptions {
	textures?: Array<Texture>;
	shader: Shader;
	/**
	 * attribute解析方式
	 * @param gl
	 */
	vertexAttribPointer?(gl: WebGL2RenderingContext, shader: Shader): number;

	/**
	 * 每一帧都会调用
	 * @param gl
	 * @param shader
	 */
	uniformsSetter?(gl: WebGL2RenderingContext, shader: Shader): void;
}

/**
 * 材质类
 *
 * 包含 着色器、纹理、顶点解析方式、uniform
 */
class Material extends Base {
	constructor(options: MaterialOptions) {
		super();
		this.textures = options.textures;
		this.shader = options.shader;
		this.vertexAttribPointer = options.vertexAttribPointer;
		this.uniformsSetter = options.uniformsSetter;
	}
	public shader: Shader;
	public textures: MaterialOptions["textures"];
	public vertexAttribPointer: MaterialOptions["vertexAttribPointer"];
	public uniformsSetter: MaterialOptions["uniformsSetter"];
	private setTextureParams(gl: WebGL2RenderingContext) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
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
			shaderInstance.use(gl);
			const texture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0 + textureUnit);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			this.setInt(textureUnit, textureLocationName || `texture${textureUnit}`);
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
	private setDefaultTexture() {
		const hasSpecular = this.textures?.find((item) =>
			item.textureLocationName?.includes("specular"),
		);
		const hasDiffuse = this.textures?.find((item) =>
			item.textureLocationName?.includes("diffuse"),
		);
		if (!hasDiffuse || !hasSpecular) {
			const gl = this.getGl();
			if (!gl) return;
			const length = this.textures?.length ?? -1;
			const defaultTexture: WebGLTexture = gl.createTexture();
			gl.activeTexture(gl.TEXTURE0 + length + 1);
			gl.bindTexture(gl.TEXTURE_2D, defaultTexture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				1,
				1,
				0,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				new Uint8Array([1, 1, 1, 1]),
			);
			this.setTextureParams(gl);
			if (!hasDiffuse) {
				this.setInt(length + 1, "material.diffuse");
			}
			if (!hasSpecular) {
				this.setInt(length + 1, "material.specular");
			}
		}
	}

	public getAttribLocation(name: string): number | undefined {
		if (this.shader.program) return this.getGl()?.getAttribLocation(this.shader.program, name);
	}

	public setMatrix4(matrix4: mat4, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniformMatrix4fv(
				gl.getUniformLocation(this.shader.program, name),
				false,
				Float32Array.from(matrix4),
			);
		}
	}

	public setVec2(vec: vec2, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform2f(gl.getUniformLocation(this.shader.program, name), vec[0], vec[1]);
		}
	}

	public setVec4Array(arr: vec4[], name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			arr.forEach((item, index) => {
				gl.uniform4fv(
					gl.getUniformLocation(this.shader.program as WebGLProgram, `${name}[${index}]`),
					Float32Array.from(item),
				);
			});
		}
	}

	public setVec3(vec: vec3, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform3f(gl.getUniformLocation(this.shader.program, name), vec[0], vec[1], vec[2]);
		}
	}
	public setVec4(vec: vec4, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform4f(
				gl.getUniformLocation(this.shader.program, name),
				vec[0],
				vec[1],
				vec[2],
				vec[3],
			);
		}
	}

	public setInt(val: number, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform1i(gl.getUniformLocation(this.shader.program, name), val);
		}
	}

	public setFloat(val: number, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform1f(gl.getUniformLocation(this.shader.program, name), val);
		}
	}

	public render(scene: Scene, instance: GeometryInstance): number {
		const gl = scene.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		this.shader.use(gl);
		this.uniformsSetter?.(gl, this.shader);
		this.setVec2(vec2.fromValues(gl.canvas.width, gl.canvas.height), "resolution");
		this.setMatrix4(instance.matrix, "model");
		this.setMatrix4(scene.camera.viewMatrix, "view");
		this.setMatrix4(scene.camera.projectionMatrix, "projection");
		return this.vertexAttribPointer?.(gl, this.shader) ?? 1;
	}

	public setScene(scene: Scene): void {
		super.setScene(scene);
		this.shader.setScene(scene);
		const gl = this.getGl();
		if (!gl) return;
		this.setDefaultTexture();
		this.textures?.forEach((texture) => {
			this.resolveTexture(
				gl,
				this.shader,
				texture.image,
				texture.width,
				texture.height,
				texture.textureUnit,
				texture.textureLocationName,
			);
		});
	}
}
export { Material };
export type { MaterialOptions, Texture };
