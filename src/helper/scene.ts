import { mat4 } from "gl-matrix";
import { pi } from "mathjs";
import { GeometryInstance } from "./geometryInstance.ts";
import { Camera } from "./camera.ts";

/**
 * 1. cache projection transformation matrix
 * 2. cache geometry instance
 * 3. cache camera
 */
class Scene {
	constructor(canvas: HTMLCanvasElement) {
		this.canvas = new WeakRef(canvas);
		const gl = canvas.getContext("webgl2");
		if (!gl)
			throw new Error("fail to create webgl2 context");
		this.gl = new WeakRef(gl);
		gl.enable(gl.DEPTH_TEST);
		requestAnimationFrame(this.render);
	}
	public canvas: WeakRef<HTMLCanvasElement>;
	public gl: WeakRef<WebGL2RenderingContext>;
	/**
	 * 几何体实例
	 */
	public geometryMap: Map<
		GeometryInstance,
		GeometryInstance
	> = new Map();
	/**
	 * 相机
	 */
	public camera: Camera = new Camera({
		scene: this,
	});
	/**
	 * 投影矩阵
	 * @private
	 */
	public projection: mat4 = mat4.identity(mat4.create());
	/**
	 * 延迟时间
	 * @private
	 */
	public deltaTime: number = 0;
	/**
	 * 当前时间
	 * @private
	 */
	private currentTime: number = new Date().getTime();
	/**
	 * 更新deltaTime
	 * @private
	 */
	private updateDeltaTime() {
		this.deltaTime = this.currentTime;
		this.currentTime = new Date().getTime();
		this.deltaTime = this.currentTime - this.deltaTime;
	}

	/**
	 * 清空屏幕
	 * @param gl
	 * @private
	 */
	private clearScreen(gl: WebGL2RenderingContext) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0.2, 0.2, 0.2, 1);
	}
	/**
	 * 渲染函数
	 * @private
	 */
	private render() {
		const gl = this.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		this.updateDeltaTime();
		this.clearScreen(gl);
		updateProjection(gl, this.projection);
		this.camera.render();
		this.geometryMap.forEach((item) => {
			item.render(this);
		});
		requestAnimationFrame(this.render);
	}
}

function updateProjection(
	gl: WebGL2RenderingContext,
	projection: mat4,
) {
	mat4.perspective(
		projection,
		pi / 4,
		gl.canvas.width / gl.canvas.height,
		1,
		Number.POSITIVE_INFINITY,
	);
}
export { Scene };
