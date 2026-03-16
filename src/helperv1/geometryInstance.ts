import { mat4 } from "gl-matrix";
import { Geometry } from "./geometry.ts";
import { Scene } from "./scene.ts";
import { Base } from "./base.ts";

interface GeometryInstanceConstructorOptions {
	geometry: Geometry;
	matrix: mat4;
}
/**
 * 几何体实例类
 */
class GeometryInstance extends Base {
	constructor(options: GeometryInstanceConstructorOptions) {
		super();
		this.geometry = options.geometry;
		this.matrix = options.matrix;
	}
	public setScene(scene: Scene): void {
		super.setScene(scene);
		this.geometry.setScene(scene);
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
