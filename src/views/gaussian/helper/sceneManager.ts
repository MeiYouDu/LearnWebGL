import {
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
} from "three";
import {
	SparkControls,
	SparkRenderer,
} from "@sparkjsdev/spark";
import { Splat } from "@/views/gaussian/helper/splat.ts";

class SceneManager {
	constructor() {
		if (!SceneManager.instance) {
			SceneManager.instance = this;
		}
		return SceneManager.instance;
	}
	public static getInstance(): SceneManager {
		if (!SceneManager.instance) {
			SceneManager.instance = new SceneManager();
		}
		return SceneManager.instance;
	}
	private static instance?: SceneManager;
	private needRender: boolean = true;
	private graphics?: Map<Splat, Splat> = new Map();
	private render = () => {
		if (!this.needRender) return;
		if (!this.camera) return;
		if (!this.scene) return;
		if (!this.renderer) return;
		if (!this.canvas) return;
		this.controls?.update(this.camera);
		this.renderer.renderer.setSize(
			(this.canvas?.parentElement ?? this.canvas)
				.offsetWidth,
			(this.canvas?.parentElement ?? this.canvas)
				.offsetHeight,
		);
		this.camera.aspect =
			(this.canvas?.parentElement ?? this.canvas)
				.offsetWidth /
			(this.canvas?.parentElement ?? this.canvas)
				.offsetHeight;
		this.graphics?.forEach((item) => item.render());
		this.renderer.renderer.render(
			this.scene as Scene,
			this.camera,
		);
	};
	private canvas?: HTMLCanvasElement;
	public scene?: Scene;
	public renderer?: SparkRenderer;
	public camera?: PerspectiveCamera;
	public controls?: SparkControls;
	public init(canvas: HTMLCanvasElement) {
		if (!canvas) throw new Error("canvas is required");
		this.canvas = canvas;
		this.scene = new Scene();
		this.renderer = new SparkRenderer({
			renderer: new WebGLRenderer({
				canvas: canvas,
			}),
			maxStdDev: Math.sqrt(3),
		});
		this.camera = new PerspectiveCamera(
			45,
			(canvas.parentElement || canvas).offsetWidth /
				(canvas?.parentElement || canvas)
					.offsetHeight,
			0.5,
			200,
		);
		this.controls = new SparkControls({
			canvas,
		});
		this.renderer.renderer.setAnimationLoop(
			this.render,
		);
	}
	public setNeedRender(status: boolean) {
		this.needRender = status;
	}
	public addGraphic(...graphics: Array<Splat>) {
		graphics.forEach((item) =>
			this.graphics?.set(item, item),
		);
	}
	public dispose(): void {
		this.scene?.clear();
		this.renderer?.renderer.dispose();
		this.renderer?.clear();
		this.camera?.clear();
		this.graphics?.forEach((item) => item.dispose());
		this.graphics?.clear();
		this.canvas = undefined;
		this.scene = undefined;
		this.renderer = undefined;
		this.camera = undefined;
		this.controls = undefined;
		this.graphics = undefined;
		SceneManager.instance = undefined;
	}
}
export { SceneManager };
