import { mat4, vec3 } from "gl-matrix";

interface CameraConstructorOptions {
	position?: vec3;
	front?: vec3;
	up?: vec3;
}
/**
 * 相机类
 */
class Camera {
	constructor(options?: CameraConstructorOptions) {
		this.position =
			options?.position || vec3.fromValues(0, 0, 3);
		this.front =
			options?.front || vec3.fromValues(0, 0, -1);
		this.up = options?.up || vec3.fromValues(0, 1, 0);
	}
	public position: vec3;
	public front: vec3;
	public up: vec3;
	public viewMatrix: mat4 = mat4.identity(mat4.create());
	public projectionMatrix: mat4 = mat4.identity(
		mat4.create(),
	);
	public render(gl: WebGL2RenderingContext) {
		void gl;
	}
	/**
	 * 销毁实例
	 */
	public dispatch() {
		// const canvas = this.scene.deref()?.canvas.deref();
		// if (!canvas) return;
	}
}

export { Camera };
