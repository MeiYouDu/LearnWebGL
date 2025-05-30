import { GeometryInstance } from "./geometryInstance.ts";
import { Camera } from "./camera.ts";

/**
 * 场景类
 */
class Scene {
	constructor(canvas: HTMLCanvasElement) {
		this.canvas = new WeakRef(canvas);
		const gl = canvas.getContext("webgl2");
		if (!gl)
			throw new Error("fail to create webgl2 context");
		this.gl = new WeakRef(gl);
		this.camera = new Camera({
			scene: this,
		});
		gl.enable(gl.DEPTH_TEST);
		requestAnimationFrame(() => this.render());
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
	public camera: Camera;
	/**
	 * 延迟时间
	 * @private
	 */
	public deltaTime: number = 0;
	public dispatch() {
		this.camera.dispatch();
	}
	public resize() {
		const gl = this.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		gl.canvas.width = (
			gl.canvas as HTMLCanvasElement
		).offsetWidth;
		gl.canvas.height = (
			gl.canvas as HTMLCanvasElement
		).offsetHeight;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}
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
		gl.clearColor(0.0, 0.0, 0.0, 1);
	}

	/**
	 * 渲染函数
	 * @private
	 */
	private render() {
		const gl = this.gl?.deref();
		if (!gl) throw new Error("gl is undefined");
		this.updateDeltaTime();
		this.resize();
		this.clearScreen(gl);
		this.camera.render(gl);
		this.geometryMap.forEach((item) => {
			item.render(this);
		});
		requestAnimationFrame(() => this.render());
	}
}

export { Scene };
