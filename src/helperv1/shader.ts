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

	protected vert?: WebGLShader;
	protected frag?: WebGLShader;

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
		return undefined;
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
		return program;
	}

	public use(gl: WebGL2RenderingContext): void {
		if (this.program) gl.useProgram(this.program);
	}

	public setScene(scene: Scene): void {
		super.setScene(scene);
		this.render(scene);
	}
	public remove() {
		const gl = this.getGl();
		if (!gl) return;
		if (this.vert) {
			gl.deleteShader(this.vert);
			this.vert = undefined;
		}
		if (this.frag) {
			gl.deleteShader(this.frag);
			this.frag = undefined;
		}
		if (this.program) {
			gl.deleteProgram(this.program);
			this.program = undefined;
		}
	}

	public render(scene: Scene) {
		const gl = scene.gl.deref();
		if (!gl) return;
		if (!this.program) {
			this.vert = this.createShader(gl, gl.VERTEX_SHADER, this.vertexShaderCode);
			this.frag = this.createShader(gl, gl.FRAGMENT_SHADER, this.fragmentShaderCode);
			if (this.vert && this.frag) {
				this.program = this.createProgram(gl, this.vert, this.frag);
			}
		}
		this.use(gl);
	}
}
export { Shader };
