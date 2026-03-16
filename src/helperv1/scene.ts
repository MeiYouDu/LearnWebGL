import { FPSControl } from "@/helper/control/FPSControl.ts";
import { Camera } from "./camera.ts";
import { GeometryInstance } from "./geometryInstance.ts";

/**
 * 场景类
 */
class Scene {
	constructor(canvas: HTMLCanvasElement) {
		this.canvas = new WeakRef(canvas);
		const gl = canvas.getContext("webgl2");
		if (!gl) throw new Error("fail to create webgl2 context");
		this.gl = new WeakRef(gl);
		this.camera = new Camera();
		this.control = new FPSControl({
			camera: this.camera,
			scene: this,
		});
		gl.enable(gl.DEPTH_TEST);
		this.requestID = this.render();
	}
	public canvas: WeakRef<HTMLCanvasElement>;
	public gl: WeakRef<WebGL2RenderingContext>;
	/**
	 * 几何体实例
	 */
	public geometryMap: Map<GeometryInstance, GeometryInstance> = new Map();
	/**
	 * 相机
	 */
	public camera: Camera;
	public control: FPSControl;
	/**
	 * 延迟时间
	 * @private
	 */
	public deltaTime: number = 0;
	/**
	 * 增加 geometry
	 * @param geo
	 */
	public add(geo: GeometryInstance) {
		geo.setScene(this);
		this.geometryMap.set(geo, geo);
	}
	public dispatch() {
		cancelAnimationFrame(this.requestID);
		this.camera.dispatch();
		this.control.dispatch();
		this.geometryMap.clear();
	}
	public resize() {
		const gl = this.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		gl.canvas.width = (gl.canvas as HTMLCanvasElement).offsetWidth;
		gl.canvas.height = (gl.canvas as HTMLCanvasElement).offsetHeight;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}
	private requestID: number = 0;
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
		if (!gl) {
			cancelAnimationFrame(this.requestID);
			return 0;
		}
		this.updateDeltaTime();
		this.resize();
		this.clearScreen(gl);
		this.control.render(gl);
		this.geometryMap.forEach((item) => {
			item.render(this);
		});
		this.requestID = requestAnimationFrame(() => this.render());
		return this.requestID;
	}
}

export { Scene };
