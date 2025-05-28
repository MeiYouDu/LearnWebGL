import { onMounted, onUnmounted, Ref } from "vue";
import { mat4, vec3 } from "gl-matrix";
import { pi } from "mathjs";
import { debounce } from "lodash";

interface ReturnType {
	render(
		gl: WebGL2RenderingContext,
		position: vec3,
		deltaTime: number,
	): {
		model: mat4;
		view: mat4;
		projection: mat4;
	};
}

function useInput(
	canvas: Ref<HTMLCanvasElement | undefined>,
): ReturnType {
	// if (!canvas.value) return { render };
	let cameraPos = vec3.fromValues(0, 0, 3),
		cameraFront = vec3.fromValues(0, 0, -1),
		deltaTime = 1,
		mouseIsDown: boolean = false,
		mouseMoveEvent: MouseEvent | undefined,
		model = mat4.create(),
		view = mat4.create(),
		projection = mat4.create(),
		dPos = vec3.fromValues(0, 0, 0);
	const speed = 0.01,
		maxHeading = (89 / 180) * pi,
		minHeading = (-89 / 180) * pi,
		sensitivity = 0.05,
		cameraUp = vec3.fromValues(0, 1, 0),
		headingPR = vec3.fromValues(0, 0, 0);
	function keydownHandle(ev: KeyboardEvent) {
		const left = vec3.cross(
			vec3.create(),
			cameraFront,
			cameraUp,
		);
		if (ev.code === "KeyW")
			dPos = vec3.scale(
				dPos,
				cameraFront,
				speed * deltaTime * 0.1,
			);
		if (ev.code === "KeyS")
			dPos = vec3.scale(
				dPos,
				cameraFront,
				-speed * deltaTime * 0.1,
			);
		if (ev.code === "KeyA")
			vec3.scale(dPos, left, -speed * deltaTime * 0.1);

		if (ev.code === "KeyD")
			vec3.scale(dPos, left, speed * deltaTime * 0.1);
	}
	function keyupHandle(ev: KeyboardEvent) {
		if (ev.code === "KeyW") dPos = vec3.fromValues(0, 0, 0);
		if (ev.code === "KeyS") dPos = vec3.fromValues(0, 0, 0);
		if (ev.code === "KeyA") dPos = vec3.fromValues(0, 0, 0);
		if (ev.code === "KeyD") dPos = vec3.fromValues(0, 0, 0);
	}
	const setDzZero = debounce(() => {
		dPos[2] = 0;
	}, deltaTime * 5);
	function wheelHandle(ev: WheelEvent) {
		dPos[2] = -ev.deltaY * sensitivity;
		setDzZero();
		ev.stopPropagation();
		ev.stopImmediatePropagation();
		ev.preventDefault();
	}
	function mouseDownHandle(ev: MouseEvent) {
		mouseIsDown = true;
	}
	function mouseUpHandle(ev: MouseEvent) {
		mouseIsDown = false;
		mouseMoveEvent = undefined;
		headingPR[0] = 0;
		headingPR[1] = 0;
		headingPR[2] = 0;
	}
	function mouseMoveHandle(ev: MouseEvent) {
		if (!mouseIsDown) return;
		if (mouseMoveEvent) {
			const diffX = ev.clientX - mouseMoveEvent.clientX;
			const diffY = ev.clientY - mouseMoveEvent.clientY;
			headingPR[0] =
				((-diffY * sensitivity * deltaTime * 0.1) / 180) *
				pi;
			if (headingPR[0] >= maxHeading) {
				headingPR[0] = maxHeading;
			}
			if (headingPR[0] <= minHeading) {
				headingPR[0] = minHeading;
			}
			headingPR[1] =
				((-diffX * sensitivity * deltaTime * 0.1) / 180) *
				pi;
		}
		mouseMoveEvent = ev;
	}
	onMounted(() => {
		document.addEventListener("keydown", keydownHandle);
		document.addEventListener("keyup", keyupHandle);
		canvas.value?.addEventListener("wheel", wheelHandle, {
			passive: false,
		});
		canvas.value?.addEventListener(
			"mousedown",
			mouseDownHandle,
		);
		canvas.value?.addEventListener(
			"mouseup",
			mouseUpHandle,
		);
		canvas.value?.addEventListener(
			"mousemove",
			mouseMoveHandle,
		);
	});
	onUnmounted(() => {
		document.removeEventListener("keydown", keydownHandle);
		document.removeEventListener("keyup", keyupHandle);
		canvas.value?.removeEventListener("wheel", wheelHandle);
		canvas.value?.removeEventListener(
			"mousedown",
			mouseDownHandle,
		);
		canvas.value?.removeEventListener(
			"mouseup",
			mouseUpHandle,
		);
		canvas.value?.removeEventListener(
			"mousemove",
			mouseMoveHandle,
		);
	});

	function render(
		gl: WebGL2RenderingContext,
		position: vec3,
		delta: number,
	) {
		deltaTime = delta;
		cameraPos = vec3.add(cameraPos, cameraPos, dPos);
		model = mat4.fromTranslation(model, position);
		const rotationHeading = mat4.fromXRotation(
			mat4.create(),
			headingPR[0],
		);
		const rotationPitch = mat4.fromYRotation(
			mat4.create(),
			headingPR[1],
		);
		let transformation = mat4.create();
		// TODO yqm 这里依旧有问题，当相机靠近原点时pitch 变化存在问题，后期如果需要更精细化的处理相机移动问题再优化
		transformation = mat4.multiply(
			transformation,
			rotationPitch,
			rotationHeading,
		);
		cameraFront = vec3.normalize(
			cameraFront,
			vec3.transformMat4(
				cameraFront,
				cameraFront,
				transformation,
			),
		);
		// cameraFront[0] =
		// 	cos(cameraFront[1]) * cos(cameraFront[0]);
		// cameraFront[1] = sin(cameraFront[0]);
		// cameraFront[2] =
		// 	sin(cameraFront[1]) * cos(cameraFront[0]);
		// cameraFront = vec3.normalize(cameraFront, cameraFront);
		view = mat4.lookAt(
			view,
			cameraPos,
			vec3.add(vec3.create(), cameraPos, cameraFront),
			cameraUp,
		);
		projection = mat4.perspective(
			projection,
			pi / 4,
			gl.canvas.width / gl.canvas.height,
			1,
			Number.POSITIVE_INFINITY,
		);
		return {
			model,
			view,
			projection,
		};
	}
	return {
		render,
	};
}

export { useInput };
