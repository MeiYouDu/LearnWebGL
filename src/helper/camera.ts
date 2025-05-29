import { mat4, quat, vec3 } from "gl-matrix";
import { Scene } from "./scene.ts";
import { pi } from "mathjs";
import { debounce } from "lodash";

interface CameraConstructorOptions {
	position?: vec3;
	front?: vec3;
	up?: vec3;
	speed?: number;
	sensitivity?: number;
	scene: Scene;
}
/**
 * 1. 保存相机位置，朝向，up 轴
 * 2. 计算 view transform matrix
 */
class Camera {
	constructor(options: CameraConstructorOptions) {
		this.scene = new WeakRef(options.scene);
		this.position =
			options.position || vec3.fromValues(0, 0, 3);
		this.front = options.front || vec3.fromValues(0, 0, -1);
		this.up = options.up || vec3.fromValues(0, 1, 0);
		this.speed = options.speed || 0.005;
		this.sensitivity = options.sensitivity || 0.01;
		this.initFront = vec3.copy(vec3.create(), this.front);
		this.updateMatrix();
		const canvas = this.scene.deref()?.canvas.deref();
		if (!canvas) return this;
		this.addListener(canvas);
	}
	public readonly scene: WeakRef<Scene>;
	public readonly speed: number;
	public readonly sensitivity;
	public position: vec3;
	public front: vec3;
	public up: vec3;
	public matrix: mat4 = mat4.identity(mat4.create());
	public render() {
		this.updatePosition();
		this.updateQuaternion();
		this.updateFront();
		this.updateMatrix();
	}
	/**
	 * 销毁实例
	 */
	public dispatch() {
		const canvas = this.scene.deref()?.canvas.deref();
		if (!canvas) return;
		this.removeListener(canvas);
	}

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
		document.addEventListener(
			"keydown",
			this.keydownHandle,
		);
		document.addEventListener("keyup", this.keyupHandle);
		canvas.addEventListener("wheel", this.wheelHandle, {
			passive: false,
		});
		canvas.addEventListener(
			"mousedown",
			this.mouseDownHandle,
		);
		canvas.addEventListener("mouseup", this.mouseUpHandle);
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
		document.removeEventListener("keyup", this.keyupHandle);
		canvas.removeEventListener("wheel", this.wheelHandle);
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
		if (!scene) return;
		const left = vec3.cross(
			vec3.create(),
			this.front,
			this.up,
		);
		if (ev.code === "KeyW")
			this.dPosition = vec3.scale(
				this.dPosition,
				this.front,
				this.speed * scene.deltaTime * 0.1,
			);
		if (ev.code === "KeyS")
			this.dPosition = vec3.scale(
				this.dPosition,
				this.front,
				-this.speed * scene.deltaTime * 0.1,
			);
		if (ev.code === "KeyA")
			vec3.scale(
				this.dPosition,
				left,
				-this.speed * scene.deltaTime * 0.1,
			);

		if (ev.code === "KeyD")
			vec3.scale(
				this.dPosition,
				left,
				this.speed * scene.deltaTime * 0.1,
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
	private setDzZero = debounce(function (this: Camera) {
		this.dPosition[2] = 0;
	}, 100);
	private wheelHandle(ev: WheelEvent) {
		this.dPosition[2] = -ev.deltaY * this.sensitivity;
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
		const scene = this.scene.deref();
		if (!scene) return;
		if (!this.mouseIsDown) return;
		if (this.mouseMoveEvent) {
			const diffX =
				ev.clientX - this.mouseMoveEvent.clientX;
			const diffY =
				ev.clientY - this.mouseMoveEvent.clientY;
			this.PYR[0] =
				((-diffY *
					this.sensitivity *
					scene.deltaTime *
					0.1) /
					180) *
				pi;
			if (this.PYR[0] >= this.maxPitch) {
				this.PYR[0] = this.maxPitch;
			}
			if (this.PYR[0] <= this.minPitch) {
				this.PYR[0] = this.minPitch;
			}
			this.PYR[1] =
				((-diffX *
					this.sensitivity *
					scene.deltaTime *
					0.1) /
					180) *
				pi;
		}
		this.mouseMoveEvent = ev;
	}
	private updatePosition() {
		vec3.add(this.position, this.position, this.dPosition);
	}
	private updateFront() {
		vec3.normalize(
			this.front,
			vec3.transformMat4(
				this.front,
				this.initFront,
				mat4.fromQuat(mat4.create(), this.quaternion),
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
	private updateMatrix() {
		mat4.lookAt(
			this.matrix,
			this.position,
			vec3.add(vec3.create(), this.position, this.front),
			this.up,
		);
	}
}

export { Camera };
