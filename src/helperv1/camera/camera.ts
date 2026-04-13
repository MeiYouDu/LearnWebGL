import { mat4, quat, vec3 } from "gl-matrix";
import { pi } from "mathjs";

interface CameraConstructorOptions {
	position?: vec3;
	front?: vec3;
	up?: vec3;
	near?: number;
	far?: number;
}
/**
 * 相机类
 */
class Camera {
	constructor(options?: CameraConstructorOptions) {
		this.position = options?.position || vec3.fromValues(0, -3, 0);
		this.front = options?.front || vec3.fromValues(0, 1, 0);
		this.up = options?.up || vec3.fromValues(0, 0, 1);
		this.near = options?.near ?? this.near;
		this.far = options?.far ?? this.far;
	}
	public position: vec3;
	public front: vec3;
	public up: vec3;
	public viewMatrix: mat4 = mat4.identity(mat4.create());
	public quaternion: quat = quat.create();
	public projectionMatrix: mat4 = mat4.identity(mat4.create());
	public near: number = 1;
	public far: number = 1000;

	public render(gl: WebGL2RenderingContext) {
		this.updateViewMatrix();
		this.updateProjectionMatrix(gl);
	}
	/**
	 * 销毁实例
	 */
	public dispatch() {
		// const canvas = this.scene.deref()?.canvas.deref();
		// if (!canvas) return;
	}
	private updateProjectionMatrix(gl: WebGL2RenderingContext) {
		mat4.perspective(
			this.projectionMatrix,
			pi / 4,
			gl.canvas.width / gl.canvas.height,
			this.near,
			this.far,
		);
	}
	private updateViewMatrix() {
		mat4.lookAt(
			this.viewMatrix,
			this.position,
			vec3.add(vec3.create(), this.position, this.front),
			this.up,
		);
	}
}

export { Camera };
