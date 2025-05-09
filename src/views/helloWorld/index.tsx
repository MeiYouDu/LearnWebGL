import { defineComponent, onMounted, ref, Ref } from "vue";
import vertexShaderSource from "./vertex.glsl";
import fragmentShaderSource from "./fragment.glsl";

function createShader(
	gl: WebGL2RenderingContext,
	type: WebGL2RenderingContext[
		| "FRAGMENT_SHADER"
		| "VERTEX_SHADER"],
	source: string,
): WebGLShader | undefined {
	const shader = gl.createShader(type);
	if (!shader) return;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	const success = gl.getShaderParameter(
		shader,
		gl.COMPILE_STATUS,
	);
	if (success) {
		return shader;
	}
	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

function createProgram(
	gl: WebGL2RenderingContext,
	vertex: WebGLShader,
	fragment: WebGLShader,
): WebGLProgram | undefined {
	const program = gl.createProgram();
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	const res = gl.getProgramParameter(
		program,
		gl.LINK_STATUS,
	);
	if (res) {
		return program;
	}
	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

function resizeHandle(gl: WebGL2RenderingContext) {
	// 必须得设置宽高
	gl.canvas.width = (
		gl.canvas as HTMLCanvasElement
	).offsetWidth;
	gl.canvas.height = (
		gl.canvas as HTMLCanvasElement
	).offsetHeight;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function main(
	instance: Ref<HTMLCanvasElement | undefined>,
) {
	onMounted(() => {
		if (!instance.value) return;
		const gl = instance.value.getContext("webgl2", {
			antialias: true,
			powerPreference: "high-performance",
		});
		if (!gl) return;
		const observer = new ResizeObserver(() =>
			resizeHandle(gl),
		);
		observer.observe(instance.value);
		resizeHandle(gl);
		const vertexShader = createShader(
			gl,
			gl?.VERTEX_SHADER,
			vertexShaderSource,
		);
		const fragmentShader = createShader(
			gl,
			gl?.FRAGMENT_SHADER,
			fragmentShaderSource,
		);
		if (!vertexShader || !fragmentShader) return;
		const program = createProgram(
			gl,
			vertexShader,
			fragmentShader,
		);
		if (!program) return;
		/**
		 * 顶点数据
		 */
		const vertexes = new Float32Array([
			-0.5, -0.5, 0, 0.5, -0.5, 0, 0, 0.5, 0,
		]);
		const vbo = gl.createBuffer(),
			vao = gl.createVertexArray();
		const positionAttributeLocation = gl.getAttribLocation(
			program,
			"position",
		);
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bindVertexArray(vao);
		// 传递数据
		gl.bufferData(
			gl.ARRAY_BUFFER,
			vertexes,
			gl.STATIC_DRAW,
		);
		gl.vertexAttribPointer(
			positionAttributeLocation,
			3,
			gl.FLOAT,
			false,
			0,
			0,
		);
		gl.enableVertexAttribArray(positionAttributeLocation);

		function render() {
			if (!gl) return;
			if (!program) return;
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.useProgram(program);
			gl.bindVertexArray(vao);
			gl.drawArrays(gl.TRIANGLES, 0, vertexes.length / 3);
			requestAnimationFrame(render);
		}
		render();
	});
}

export default defineComponent({
	setup() {
		const canvasRef: Ref<HTMLCanvasElement | undefined> =
			ref();
		main(canvasRef);
		return function () {
			return <canvas ref={canvasRef}></canvas>;
		};
	},
});
