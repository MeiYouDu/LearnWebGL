function resizeHandle(
	dom: HTMLElement,
	gl: WebGL2RenderingContext,
) {
	// function handle() {
	// 必须得设置宽高
	gl.canvas.width = (
		gl.canvas as HTMLCanvasElement
	).offsetWidth;
	gl.canvas.height = (
		gl.canvas as HTMLCanvasElement
	).offsetHeight;
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	// }
	// handle();
	// const observer = new ResizeObserver(handle);
	// observer.observe(dom);
}
export { resizeHandle };
