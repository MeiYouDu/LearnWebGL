import { mat4 } from "gl-matrix";
import { Base } from "../base.ts";
import { Material } from "../material/baseMaterial.ts";
import { BlinnPhongMaterial } from "../material/index.ts";
import { Scene } from "../scene.ts";
import { Geometry } from "./geometry.ts";

interface GeometryInstanceConstructorOptions {
	geometry: Geometry;
	matrix?: mat4;
	material?: Material;
}
/**
 * 几何体实例类
 *
 * 组合几何体与材质
 */
class GeometryInstance extends Base {
	constructor(options: GeometryInstanceConstructorOptions) {
		super();
		this.geometry = options.geometry;
		this.matrix = options.matrix ?? this.matrix;
		this.material = options.material ?? new BlinnPhongMaterial();
	}
	public setScene(scene: Scene): void {
		super.setScene(scene);
		// material.setScene内部会创建 shader program，并调用 shader.use
		this.material.setScene(scene);
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
	 * 材质
	 */
	public material: Material;
	/**
	 * 渲染函数
	 */
	public render(scene: Scene) {
		const gl = this.getGl();
		if (!gl) return;
		this.geometry.bind(gl);
		this.material.beforeDraw(scene, this.material);
		this.material.render(scene, this);
		// 绘制时按当前 shader 配置属性解析（同一 VAO 可被不同材质复用）
		this.geometry.draw(gl, this.material.shader);
		this.material.unBindTexture(scene);
		this.material.afterDraw(scene, this.material);
	}
	public remove() {
		this.geometry.remove();
		this.material.remove();
	}
}
export { GeometryInstance };
