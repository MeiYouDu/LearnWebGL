import { Shader } from "../shader";

/**
 * position normal texture
 * @param gl
 * @param shader
 * @returns
 */
function PNTAttribPointer(gl: WebGL2RenderingContext, shader: Shader): number {
	const stride = 8;
	const positionAttrLocation = shader.getAttribLocation("position");
	const normalAttrLocation = shader.getAttribLocation("normal");
	const texCoordAttrLocation = shader.getAttribLocation("texCoord");

	if (typeof positionAttrLocation === "number" && positionAttrLocation >= 0) {
		gl.vertexAttribPointer(positionAttrLocation, 3, gl.FLOAT, false, stride * 4, 0);
		gl.enableVertexAttribArray(positionAttrLocation);
	}
	if (typeof normalAttrLocation === "number" && normalAttrLocation >= 0) {
		gl.vertexAttribPointer(normalAttrLocation, 3, gl.FLOAT, false, stride * 4, 3 * 4);
		gl.enableVertexAttribArray(normalAttrLocation);
	}
	if (typeof texCoordAttrLocation === "number" && texCoordAttrLocation >= 0) {
		gl.vertexAttribPointer(texCoordAttrLocation, 2, gl.FLOAT, false, stride * 4, 6 * 4);
		gl.enableVertexAttribArray(texCoordAttrLocation);
	}
	return stride;
}
/**
 * position
 * @param gl
 * @param shader
 * @returns
 */
function PAttribPointer(gl: WebGL2RenderingContext, shader: Shader): number {
	const stride = 3;
	const positionAttrLocation = shader.getAttribLocation("position");

	if (typeof positionAttrLocation === "number" && positionAttrLocation >= 0) {
		gl.vertexAttribPointer(positionAttrLocation, 3, gl.FLOAT, false, stride * 4, 0);
		gl.enableVertexAttribArray(positionAttrLocation);
	}
	return stride;
}
/**
 * position normal
 * @param gl
 * @param shader
 * @returns
 */
function PNAttribPointer(gl: WebGL2RenderingContext, shader: Shader): number {
	const stride = 6;
	const positionAttrLocation = shader.getAttribLocation("position");
	const normalAttrLocation = shader.getAttribLocation("normal");

	if (typeof positionAttrLocation === "number" && positionAttrLocation >= 0) {
		gl.vertexAttribPointer(positionAttrLocation, 3, gl.FLOAT, false, stride * 4, 0);
		gl.enableVertexAttribArray(positionAttrLocation);
	}
	if (typeof normalAttrLocation === "number" && normalAttrLocation >= 0) {
		gl.vertexAttribPointer(normalAttrLocation, 3, gl.FLOAT, false, stride * 4, 3 * 4);
		gl.enableVertexAttribArray(normalAttrLocation);
	}
	return stride;
}
/**
 * position texture
 * @param gl
 * @param shader
 * @returns
 */
function PTAttribPointer(gl: WebGL2RenderingContext, shader: Shader): number {
	const stride = 5;
	const positionAttrLocation = shader.getAttribLocation("position");
	const texCoordAttrLocation = shader.getAttribLocation("texCoord");

	if (typeof positionAttrLocation === "number" && positionAttrLocation >= 0) {
		gl.vertexAttribPointer(positionAttrLocation, 3, gl.FLOAT, false, stride * 4, 0);
		gl.enableVertexAttribArray(positionAttrLocation);
	}
	if (typeof texCoordAttrLocation === "number" && texCoordAttrLocation >= 0) {
		gl.vertexAttribPointer(texCoordAttrLocation, 2, gl.FLOAT, false, stride * 4, 3 * 4);
		gl.enableVertexAttribArray(texCoordAttrLocation);
	}
	return stride;
}
/**
 * 后处理专用attribute Pointer
 * @param gl
 * @param shader
 * @returns
 */
function postProcessingAttribPointer(gl: WebGL2RenderingContext, shader: Shader): number {
	const stride = 4;
	const positionAttrLocation = shader.getAttribLocation("position");
	const texCoordAttrLocation = shader.getAttribLocation("texCoord");

	if (typeof positionAttrLocation === "number" && positionAttrLocation >= 0) {
		gl.vertexAttribPointer(positionAttrLocation, 2, gl.FLOAT, false, stride * 4, 0);
		gl.enableVertexAttribArray(positionAttrLocation);
	}
	if (typeof texCoordAttrLocation === "number" && texCoordAttrLocation >= 0) {
		gl.vertexAttribPointer(texCoordAttrLocation, 2, gl.FLOAT, false, stride * 4, 2 * 4);
		gl.enableVertexAttribArray(texCoordAttrLocation);
	}
	return stride;
}

export {
	PAttribPointer,
	PNAttribPointer,
	PNTAttribPointer,
	postProcessingAttribPointer,
	PTAttribPointer,
};
