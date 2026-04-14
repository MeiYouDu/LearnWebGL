import { mat4, vec3 } from "gl-matrix";
import { FPSControl, PostProcessingGeometry, PostProcessingGeometryInstance } from "./";
import { Camera } from "./camera/camera.ts";
import { GeometryInstance } from "./geometry/geometryInstance.ts";

/**
 * 场景配置
 */
interface SceneOptions extends WebGLContextAttributes {
	canvas: HTMLCanvasElement;
	camera?: Camera;
	control?: FPSControl;
}
/**
 * 场景类
 */
class Scene {
	constructor(options: SceneOptions) {
		this.canvas = new WeakRef(options.canvas);
		const gl = options.canvas.getContext("webgl2", options);
		if (!gl) throw new Error("fail to create webgl2 context");
		this.gl = new WeakRef(gl);
		this.camera = options.camera ?? options.control?.camera?.deref() ?? new Camera();
		this.control =
			options.control ??
			new FPSControl({
				camera: this.camera,
			});
		this.control.setScene(this);
		if (options.depth !== false) {
			gl.enable(gl.DEPTH_TEST);
		}
		if (options.stencil) {
			gl.enable(gl.STENCIL_TEST);
		}
		this.requestID = this.render();
	}
	public canvas: WeakRef<HTMLCanvasElement>;
	public gl: WeakRef<WebGL2RenderingContext>;
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
	public add(geo: GeometryInstance): this {
		geo.setScene(this);
		this.geometryMap.set(geo, geo);
		return this;
	}
	/**
	 * 移除几何体
	 * @param geo
	 * @returns
	 */
	public remove(geo: GeometryInstance) {
		this.geometryMap.delete(geo);
		return this;
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
	/**
	 * 几何体实例
	 */
	private geometryMap: Map<GeometryInstance, GeometryInstance> = new Map();
	/**
	 * 后处理
	 */
	private postProcess?: GeometryInstance;
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
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
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
		const noBlend: GeometryInstance[] = [];
		const blend: GeometryInstance[] = [];
		const postProcess: Array<PostProcessingGeometryInstance> = [];
		this.geometryMap.forEach((item) => {
			if (item instanceof PostProcessingGeometryInstance) {
				return postProcess.push(item);
			}
			if (item.geometry.material.blend) {
				blend.push(item);
			} else {
				noBlend.push(item);
			}
		});
		blend.sort((a, b) => {
			const aPos = mat4.getTranslation(vec3.create(), a.matrix);
			const bPos = mat4.getTranslation(vec3.create(), b.matrix);
			const cPos = this.camera.position;
			return vec3.sqrDist(bPos, cPos) - vec3.sqrDist(aPos, cPos);
		});
		postProcess.forEach((item) => {
			// 如果存在后处理几何体几何体则先执行绑定 FBO
			if (item instanceof PostProcessingGeometry) {
				item.bind();
			}
		});
		// FBO 绑定之后正常绘制
		noBlend.forEach((item) => {
			if (item.geometry.material.culling) {
				gl.enable(gl.CULL_FACE);
			} else {
				gl.disable(gl.CULL_FACE);
			}
			item.render(this);
		});
		blend.forEach((item) => {
			if (item.geometry.material.culling) {
				gl.enable(gl.CULL_FACE);
			} else {
				gl.disable(gl.CULL_FACE);
			}
			item.render(this);
		});
		this.postProcess?.render(this);
		this.requestID = requestAnimationFrame(() => this.render());
		return this.requestID;
	}
}

export { Scene };
export type { SceneOptions };
