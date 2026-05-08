import { Material } from "../material";

/**
 * position normal texture
 * @param gl
 * @param material
 * @returns
 */
function PNTAttribPointer(gl: WebGL2RenderingContext, material: Material): number {
	const stride = 8;
	const positionAttrLocation = material.getAttribLocation("position");
	const normalAttrLocation = material.getAttribLocation("normal");
	const texCoordAttrLocation = material.getAttribLocation("texCoord");

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
 * @param material
 * @returns
 */
function PAttribPointer(gl: WebGL2RenderingContext, material: Material): number {
	const stride = 3;
	const positionAttrLocation = material.getAttribLocation("position");

	if (typeof positionAttrLocation === "number" && positionAttrLocation >= 0) {
		gl.vertexAttribPointer(positionAttrLocation, 3, gl.FLOAT, false, stride * 4, 0);
		gl.enableVertexAttribArray(positionAttrLocation);
	}
	return stride;
}
/**
 * position normal
 * @param gl
 * @param material
 * @returns
 */
function PNAttribPointer(gl: WebGL2RenderingContext, material: Material): number {
	const stride = 6;
	const positionAttrLocation = material.getAttribLocation("position");
	const normalAttrLocation = material.getAttribLocation("normal");

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
 * @param material
 * @returns
 */
function PTAttribPointer(gl: WebGL2RenderingContext, material: Material): number {
	const stride = 5;
	const positionAttrLocation = material.getAttribLocation("position");
	const texCoordAttrLocation = material.getAttribLocation("texCoord");

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
 * @param material
 * @returns
 */
function postProcessingAttribPointer(gl: WebGL2RenderingContext, material: Material): number {
	const stride = 4;
	const positionAttrLocation = material.getAttribLocation("position");
	const texCoordAttrLocation = material.getAttribLocation("texCoord");

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
