import { onMounted, onUnmounted, Ref } from "vue";
import { mat4, vec2, vec3 } from "gl-matrix";
import { pi } from "mathjs";

interface ReturnType {
	render(
		gl: WebGL2RenderingContext,
		position: vec3,
	): {
		// x: number;
		// y: number;
		// z: number;
		// dx: number;
		// dy: number;
		// dz: number;
		// rx: number;
		// ry: number;
		// rz: number;
		// degree: number;
		// speed: number;
		model: mat4;
		view: mat4;
		projection: mat4;
	};
}

function useInput(
	canvas: Ref<HTMLCanvasElement | undefined>,
): ReturnType {
	// if (!canvas.value) return { render };
	let x = 0,
		y = 0,
		z = -3,
		dx = 0,
		dy = 0,
		dz = 0,
		rx = 0,
		ry = 0,
		rz = 1,
		degree = 0,
		mouseIsDown: boolean = false,
		mouseMoveEvent: MouseEvent | undefined,
		model = mat4.create(),
		view = mat4.create(),
		projection = mat4.create(),
		modelCache = mat4.create();
	const speed = 0.01;
	function keydownHandle(ev: KeyboardEvent) {
		if (ev.code === "KeyW") dy = speed;
		if (ev.code === "KeyS") dy = -speed;
		if (ev.code === "KeyA") dx = -speed;
		if (ev.code === "KeyD") dx = speed;
	}
	function keyupHandle(ev: KeyboardEvent) {
		if (ev.code === "KeyW") dy = 0.0;
		if (ev.code === "KeyS") dy = 0.0;
		if (ev.code === "KeyA") dx = 0.0;
		if (ev.code === "KeyD") dx = 0.0;
	}
	function wheelHandle(ev: WheelEvent) {
		dz = -ev.deltaY * 0.005;
		setTimeout(() => {
			dz = 0;
		}, 300);
		ev.stopPropagation();
		ev.stopImmediatePropagation();
		ev.preventDefault();
	}
	function mouseDownHandle(ev: MouseEvent) {
		mouseIsDown = true;
		if (!mouseMoveEvent) mouseMoveEvent = ev;
	}
	function mouseUpHandle(ev: MouseEvent) {
		mouseIsDown = false;
		mouseMoveEvent = undefined;
		modelCache = model;
	}
	function mouseMoveHandle(ev: MouseEvent) {
		if (!mouseIsDown) return;
		if (!mouseMoveEvent) return;
		const diffX = ev.clientX - mouseMoveEvent.clientX;
		const diffY = ev.clientY - mouseMoveEvent.clientY;
		let dir = vec2.fromValues(diffY, diffX);
		degree = vec2.len(dir) / 5;
		dir = vec2.normalize(dir, dir);
		rx = dir[0];
		ry = dir[1];
		rz = 0;
		if (rx === 0 && ry === 0 && rz === 0) {
			rz = 1;
		}
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
	) {
		x += dx;
		y += dy;
		z += dz;
		let M = mat4.create();
		const trans = mat4.fromTranslation(model, position);
		model = mat4.rotate(
			mat4.create(),
			modelCache,
			(degree / 180) * pi,
			vec3.fromValues(rx, ry, rz),
		);
		M = mat4.multiply(M, model, trans);
		view = mat4.fromTranslation(
			view,
			vec3.fromValues(x, y, z),
		);
		projection = mat4.perspective(
			projection,
			pi / 4,
			gl.canvas.width / gl.canvas.height,
			1,
			Number.POSITIVE_INFINITY,
		);
		return {
			model: M,
			view,
			projection,
		};
	}
	return {
		render,
	};
}

export { useInput };
