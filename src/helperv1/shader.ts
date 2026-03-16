import { Base } from "./base";
import { Scene } from "./scene";

/**
 * 保存 shader
 */
class Shader extends Base {
	constructor(
		private vertexShaderCode: string,
		private fragmentShaderCode: string,
	) {
		super();
	}
	/**
	 * gl program id
	 */
	public program?: WebGLProgram;

	/**
	 * 创建 shader
	 * @param gl
	 * @param type
	 * @param source
	 */
	private createShader(
		gl: WebGL2RenderingContext,
		type: WebGL2RenderingContext["FRAGMENT_SHADER" | "VERTEX_SHADER"],
		source: string,
	): WebGLShader | undefined {
		const shader = gl.createShader(type);
		if (!shader) return;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
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
		const res = gl.getProgramParameter(program, gl.LINK_STATUS);
		if (res) {
			return program;
		}
		console.log(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
	}

	public use(gl: WebGL2RenderingContext): void {
		if (this.program) gl.useProgram(this.program);
	}

	public render(scene: Scene) {
		const gl = scene.gl.deref();
		if (!gl) return;
		if (!this.program) {
			const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, this.vertexShaderCode);
			const fragmentShader = this.createShader(
				gl,
				gl.FRAGMENT_SHADER,
				this.fragmentShaderCode,
			);
			if (vertexShader && fragmentShader) {
				this.program = this.createProgram(gl, vertexShader, fragmentShader);
			}
		}
		if (this.program) {
			gl.useProgram(this.program);
		}
	}
}
export { Shader };
