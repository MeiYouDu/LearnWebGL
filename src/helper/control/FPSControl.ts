import { Camera } from "@/helper/camera.ts";
import { mat4, quat, vec3 } from "gl-matrix";
import { debounce } from "lodash";
import { pi } from "mathjs";
import { Scene } from "@/helper/scene.ts";

interface CameraConstructorOptions {
	speed?: number;
	sensitivity?: number;
	camera: Camera;
	scene: Scene;
}

class FPSControl {
	constructor(options: CameraConstructorOptions) {
		this.camera = new WeakRef(options.camera);
		this._speed = options.speed || 0.05;
		this.sensitivity = options.sensitivity || 0.005;
		this.initFront = vec3.copy(
			vec3.create(),
			options.camera.front,
		);
		this.scene = new WeakRef(options.scene);
		const canvas = options.scene.canvas.deref();
		if (canvas) this.addListener(canvas);
	}
	public readonly scene: WeakRef<Scene>;
	public getSpeed(isShift?: boolean): number {
		if (isShift) return this._speed * 3;
		return this._speed;
	}
	public readonly sensitivity;
	public camera?: WeakRef<Camera>;
	public render(gl: WebGL2RenderingContext) {
		this.camera?.deref()?.render(gl);
		this.updatePosition();
		this.updateQuaternion();
		this.updateFront();
		this.updateViewMatrix();
	}
	/**
	 * 销毁实例
	 */
	public dispatch() {
		const canvas = this.scene.deref()?.canvas.deref();
		if (!canvas) return;
		this.removeListener(canvas);
	}
	private _speed: number;
	private mouseIsDown: boolean = false;
	private mouseMoveEvent: MouseEvent | undefined;
	/**
	 * 位置变化量
	 */
	private dPosition = vec3.fromValues(0, 0, 0);
	/**
	 * 欧拉角
	 */
	private PYR: vec3 = vec3.fromValues(0, 0, 0);
	private maxPitch: number = (89 / 180) * pi;
	private minPitch: number = (-89 / 180) * pi;
	private quaternion: quat = quat.create();

	/**
	 * 记录初始位置方便四元数累加
	 * @private
	 */
	private readonly initFront: vec3;

	private addListener(canvas: HTMLCanvasElement) {
		this.keydownHandle = this.keydownHandle.bind(this);

		this.mouseMoveHandle =
			this.mouseMoveHandle.bind(this);

		this.keyupHandle = this.keyupHandle.bind(this);

		this.wheelHandle = this.wheelHandle.bind(this);

		this.mouseDownHandle =
			this.mouseDownHandle.bind(this);

		this.mouseUpHandle = this.mouseUpHandle.bind(this);
		document.addEventListener(
			"keydown",
			this.keydownHandle,
		);
		document.addEventListener(
			"keyup",
			this.keyupHandle,
		);
		canvas.addEventListener("wheel", this.wheelHandle, {
			passive: false,
		});
		canvas.addEventListener(
			"mousedown",
			this.mouseDownHandle,
		);
		canvas.addEventListener(
			"mouseup",
			this.mouseUpHandle,
		);
		canvas.addEventListener(
			"mousemove",
			this.mouseMoveHandle,
		);
	}
	private removeListener(canvas: HTMLCanvasElement) {
		document.removeEventListener(
			"keydown",
			this.keydownHandle,
		);
		document.removeEventListener(
			"keyup",
			this.keyupHandle,
		);
		canvas.removeEventListener(
			"wheel",
			this.wheelHandle,
		);
		canvas.removeEventListener(
			"mousedown",
			this.mouseDownHandle,
		);
		canvas.removeEventListener(
			"mouseup",
			this.mouseUpHandle,
		);
		canvas.removeEventListener(
			"mousemove",
			this.mouseMoveHandle,
		);
	}
	private keydownHandle(ev: KeyboardEvent) {
		const scene = this.scene.deref();
		const camera = this.camera?.deref();
		if (!camera) return;
		if (!scene) return;
		const left = vec3.cross(
			vec3.create(),
			camera.front,
			camera.up,
		);
		if (ev.code === "KeyW")
			this.dPosition = vec3.scale(
				this.dPosition,
				camera.front,
				this.getSpeed(ev.shiftKey) *
					scene.deltaTime *
					0.1,
			);
		if (ev.code === "KeyS")
			this.dPosition = vec3.scale(
				this.dPosition,
				camera.front,
				-this.getSpeed(ev.shiftKey) *
					scene.deltaTime *
					0.1,
			);
		if (ev.code === "KeyA")
			vec3.scale(
				this.dPosition,
				left,
				-this.getSpeed(ev.shiftKey) *
					scene.deltaTime *
					0.1,
			);

		if (ev.code === "KeyD")
			vec3.scale(
				this.dPosition,
				left,
				this.getSpeed(ev.shiftKey) *
					scene.deltaTime *
					0.1,
			);
	}
	private keyupHandle(ev: KeyboardEvent) {
		if (ev.code === "KeyW")
			this.dPosition = vec3.fromValues(0, 0, 0);
		if (ev.code === "KeyS")
			this.dPosition = vec3.fromValues(0, 0, 0);
		if (ev.code === "KeyA")
			this.dPosition = vec3.fromValues(0, 0, 0);
		if (ev.code === "KeyD")
			this.dPosition = vec3.fromValues(0, 0, 0);
	}
	private setDzZero = debounce(function (
		this: FPSControl,
	) {
		this.dPosition = vec3.fromValues(0, 0, 0);
	}, 100);
	private wheelHandle(ev: WheelEvent) {
		const camera = this.camera?.deref();
		const scene = this.scene.deref();
		if (!scene) return;
		if (!camera) return;
		this.dPosition = vec3.scale(
			this.dPosition,
			camera.front,
			-ev.deltaY *
				this.sensitivity *
				scene.deltaTime *
				0.05,
		);
		this.setDzZero();
		ev.stopPropagation();
		ev.stopImmediatePropagation();
		ev.preventDefault();
	}
	private mouseDownHandle() {
		this.mouseIsDown = true;
	}
	private mouseUpHandle() {
		this.mouseIsDown = false;
		this.mouseMoveEvent = undefined;
		this.PYR = vec3.create();
	}
	private mouseMoveHandle(ev: MouseEvent) {
		if (!this.mouseIsDown) return;
		if (this.mouseMoveEvent) {
			const scene = this.scene.deref();
			if (!scene) return;
			const diffX =
				ev.clientX - this.mouseMoveEvent.clientX;
			const diffY =
				ev.clientY - this.mouseMoveEvent.clientY;
			this.PYR[0] =
				(-diffY *
					this.sensitivity *
					scene.deltaTime *
					pi) /
				180;
			if (this.PYR[0] >= this.maxPitch) {
				this.PYR[0] = this.maxPitch;
			}
			if (this.PYR[0] <= this.minPitch) {
				this.PYR[0] = this.minPitch;
			}
			this.PYR[1] =
				(-diffX *
					this.sensitivity *
					scene.deltaTime *
					pi) /
				180;
		}
		this.mouseMoveEvent = ev;
	}

	private updatePosition() {
		const camera = this.camera?.deref();
		if (!camera) return;
		vec3.add(
			camera.position,
			camera.position,
			this.dPosition,
		);
	}
	private updateFront() {
		const camera = this.camera?.deref();
		if (!camera) return;
		vec3.normalize(
			camera.front,
			vec3.transformMat4(
				camera.front,
				this.initFront,
				mat4.fromQuat(
					mat4.create(),
					this.quaternion,
				),
			),
		);
	}
	private updateQuaternion() {
		quat.rotateY(
			this.quaternion,
			this.quaternion,
			this.PYR[1],
		);
		quat.normalize(this.quaternion, this.quaternion);
		quat.rotateX(
			this.quaternion,
			this.quaternion,
			this.PYR[0],
		); // 直接更新持续的四元数
		quat.normalize(this.quaternion, this.quaternion); // 每次更新后归一化
	}
	private updateViewMatrix() {
		const camera = this.camera?.deref();
		if (!camera) return;
		mat4.lookAt(
			camera.viewMatrix,
			camera.position,
			vec3.add(
				vec3.create(),
				camera.position,
				camera.front,
			),
			camera.up,
		);
	}
}

export { FPSControl };
