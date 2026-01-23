import { mat4 } from "gl-matrix";
import { Geometry } from "./geometry.ts";
import { Scene } from "./scene.ts";

interface GeometryInstanceConstructorOptions {
	geometry: Geometry;
	matrix: mat4;
}
/**
 * 几何体实例类
 */
class GeometryInstance {
	constructor(options: GeometryInstanceConstructorOptions) {
		this.geometry = options.geometry;
		this.matrix = options.matrix;
	}
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
