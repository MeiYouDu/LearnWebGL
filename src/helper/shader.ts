import { mat4, vec2, vec4 } from "gl-matrix";

/**
 * 保存 shader
 */
class Shader {
	constructor(
		gl: WebGL2RenderingContext,
		vertexShaderCode: string,
		fragmentShaderCode: string,
	) {
		this.gl = new WeakRef(gl);
		const vertexShader = this.createShader(
			gl,
			gl.VERTEX_SHADER,
			vertexShaderCode,
		);
		const fragmentShader = this.createShader(
			gl,
			gl.FRAGMENT_SHADER,
			fragmentShaderCode,
		);
		if (vertexShader && fragmentShader) {
			this.program = this.createProgram(
				gl,
				vertexShader,
				fragmentShader,
			);
		}
	}
	/**
	 * gl program id
	 * @private
	 */
	private readonly program?: WebGLProgram;

	/**
	 * 创建 shader
	 * @param gl
	 * @param type
	 * @param source
	 */
	private createShader(
		gl: WebGL2RenderingContext,
		type: WebGL2RenderingContext[
			| "FRAGMENT_SHADER"
			| "VERTEX_SHADER"],
		source: string,
	): WebGLShader | undefined {
		const shader = gl.createShader(type);
		if (!shader) return;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		const success = gl.getShaderParameter(
			shader,
			gl.COMPILE_STATUS,
		);
		if (success) {
			return shader;
		}
		console.log(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
	}

	/**
	 * create gl program
	 * @param gl
	 * @param vertex
	 * @param fragment
	 */
	private createProgram(
		gl: WebGL2RenderingContext,
		vertex: WebGLShader,
		fragment: WebGLShader,
	): WebGLProgram | undefined {
		const program = gl.createProgram();
		gl.attachShader(program, vertex);
		gl.attachShader(program, fragment);
		gl.linkProgram(program);
		const res = gl.getProgramParameter(
			program,
			gl.LINK_STATUS,
		);
		if (res) {
			return program;
		}
		console.log(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
	}
	/**
	 * gl 引用
	 * @private
	 */
	public gl: WeakRef<WebGL2RenderingContext>;

	public getAttribLocation(
		name: string,
	): number | undefined {
		if (this.program)
			return this.gl
				.deref()
				?.getAttribLocation(this.program, name);
	}

	public setMatrix4(matrix4: mat4, name: string) {
		const gl = this.gl.deref();
		if (!gl) return;
		if (this.program) {
			gl.uniformMatrix4fv(
				gl.getUniformLocation(this.program, name),
				false,
				matrix4,
			);
		}
	}

	public setVec2(vec: vec2, name: string) {
		const gl = this.gl.deref();
		if (!gl) return;
		if (this.program) {
			gl.uniform2f(
				gl.getUniformLocation(this.program, name),
				vec[0],
				vec[1],
			);
		}
	}

	public setVec4Array(arr: vec4[], name: string) {
		const gl = this.gl.deref();
		if (!gl) return;
		if (this.program) {
			arr.forEach((item, index) => {
				gl.uniform4fv(
					gl.getUniformLocation(
						this.program as WebGLProgram,
						`${name}[${index}]`,
					),
					item,
				);
			});
		}
	}

	public setInt(val: number, name: string) {
		const gl = this.gl.deref();
		if (!gl) return;
		if (this.program) {
			gl.uniform1i(
				gl.getUniformLocation(this.program, name),
				val,
			);
		}
	}

	public setFloat(val: number, name: string) {
		const gl = this.gl.deref();
		if (!gl) return;
		if (this.program) {
			gl.uniform1f(
				gl.getUniformLocation(this.program, name),
				val,
			);
		}
	}

	public use(): void {
		if (this.program)
			this.gl.deref()?.useProgram(this.program);
	}
}
export { Shader };
