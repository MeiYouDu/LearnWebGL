import { mat4, vec3 } from "gl-matrix";
import { Geometry } from "./geometry.ts";
import { Scene } from "./scene.ts";

interface GeometryInstanceConstructorOptions {
	position: vec3;
	geometry: Geometry;
	matrix: mat4;
}
/**
 * 1. cache position
 * 2. cache geometry
 */
class GeometryInstance {
	constructor(options: GeometryInstanceConstructorOptions) {
		this.position = options.position;
		this.geometry = options.geometry;
		this.matrix = options.matrix;
	}
	/**
	 * 位置
	 */
	public position: vec3;
	/**
	 * 旋转和平移矩阵
	 */
	public matrix: mat4 = mat4.identity(mat4.create());
	/**
	 * 几何体
	 */
	public geometry: Geometry;
	/**
	 * 渲染函数
	 */
	public render(scene: Scene) {
		this.geometry.render(scene, this);
	}
}
export { GeometryInstance };
