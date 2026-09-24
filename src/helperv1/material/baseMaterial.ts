import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { Base } from "../base";
import { GeometryInstance } from "../geometry/geometryInstance";
import { Scene } from "../scene";
import { Shader } from "../shader";
import { Texture } from "../texture";

/**
 * 材质纹理绑定
 */
interface MaterialTexture {
	texture: Texture;
	/**
	 * sampler 名，缺省 `texture${unit}`
	 */
	name?: string;
	/**
	 * 纹理单元，缺省数组下标
	 */
	unit?: number;
}

interface MaterialOptions {
	textures?: Array<MaterialTexture>;
	shader: Shader;
	/**
	 * 每一帧都会调用
	 * @param gl
	 * @param shader
	 */
	uniformsSetter?(gl: WebGL2RenderingContext, shader: Material): void;
	/**
	 * 绘制前
	 * @param scene
	 * @param material
	 */
	beforeDraw?(scene: Scene, material: Material): void;
	/**
	 * 绘制后
	 * @param scene
	 * @param material
	 */
	afterDraw?(scene: Scene, material: Material): void;
	/**
	 * 开启混合
	 */
	blend?: boolean;
	/**
	 * 面剔除
	 */
	culling?: boolean;
}

/**
 * 材质类
 *
 * 组合 着色器、纹理、渲染状态、uniform
 */
class Material extends Base {
	constructor(options: MaterialOptions) {
		super();
		this.textures = options.textures ?? [];
		this.shader = options.shader;
		this.uniformsSetter = options.uniformsSetter;
		this.beforeDraw = options.beforeDraw ?? this.beforeDraw;
		this.afterDraw = options.afterDraw ?? this.afterDraw;
		this.blend = options.blend ?? this.blend;
		this.culling = options.culling ?? this.culling;
	}
	public shader: Shader;
	public textures: Array<MaterialTexture>;
	public uniformsSetter: MaterialOptions["uniformsSetter"];
	public blend = false;
	public culling = false;
	/**
	 * 自建的兜底纹理（1×1 白色），remove 时释放
	 */
	protected defaultTextures: Array<{ texture: Texture; unit: number }> = [];

	/**
	 * 兜底纹理：shader 需要 material.diffuse / material.specular 但材质未提供对应纹理时，
	 * 用 1×1 白色纹理占位，避免采样到未绑定的纹理单元
	 */
	protected createDefaultTextures(scene: Scene) {
		if (this.defaultTextures.length) return;
		const gl = this.getGl();
		const program = this.shader.program;
		if (!gl || !program) return;
		const hasDiffuse = this.textures.some((binding) =>
			(binding.name ?? "").includes("diffuse"),
		);
		const hasSpecular = this.textures.some((binding) =>
			(binding.name ?? "").includes("specular"),
		);
		if (hasDiffuse && hasSpecular) return;
		// 只兜底 shader 里真实存在的 sampler，避免创建无用纹理
		const names = [
			!hasDiffuse ? "material.diffuse" : undefined,
			!hasSpecular ? "material.specular" : undefined,
		].filter((name): name is string => !!name && !!gl.getUniformLocation(program, name));
		if (!names.length) return;
		const unit = this.textures.length;
		const texture = new Texture({
			data: { pixels: new Uint8Array([255, 255, 255, 255]), width: 1, height: 1 },
			filter: { min: gl.LINEAR, mag: gl.LINEAR },
			generateMipmap: false,
		});
		texture.setScene(scene);
		names.forEach((name) => this.setInt(unit, name));
		this.defaultTextures.push({ texture, unit });
	}

	public setMatrix4(matrix4: mat4, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniformMatrix4fv(
				gl.getUniformLocation(this.shader.program, name),
				false,
				Float32Array.from(matrix4),
			);
		}
	}

	public setVec2(vec: vec2, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform2f(gl.getUniformLocation(this.shader.program, name), vec[0], vec[1]);
		}
	}

	public setVec4Array(arr: vec4[], name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			arr.forEach((item, index) => {
				gl.uniform4fv(
					gl.getUniformLocation(this.shader.program as WebGLProgram, `${name}[${index}]`),
					Float32Array.from(item),
				);
			});
		}
	}

	public setVec3(vec: vec3, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform3f(gl.getUniformLocation(this.shader.program, name), vec[0], vec[1], vec[2]);
		}
	}
	public setVec4(vec: vec4, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform4f(
				gl.getUniformLocation(this.shader.program, name),
				vec[0],
				vec[1],
				vec[2],
				vec[3],
			);
		}
	}

	public setInt(val: number, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform1i(gl.getUniformLocation(this.shader.program, name), val);
		}
	}

	public setFloat(val: number, name: string) {
		const gl = this.getGl();
		if (!gl) return;
		if (this.shader.program) {
			gl.uniform1f(gl.getUniformLocation(this.shader.program, name), val);
		}
	}

	public render(scene: Scene, instance: GeometryInstance) {
		const gl = scene.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		this.shader.render(scene);
		this.textures.forEach((binding, index) => {
			const unit = binding.unit ?? index;
			this.setInt(unit, binding.name ?? `texture${unit}`);
			binding.texture.bind(gl, unit);
		});
		this.defaultTextures.forEach((binding) => {
			binding.texture.bind(gl, binding.unit);
		});
		this.uniformsSetter?.(gl, this);
		this.setVec2(vec2.fromValues(gl.canvas.width, gl.canvas.height), "resolution");
		this.setVec3(scene.camera.position, "cameraPos");
		this.setMatrix4(instance.matrix, "model");
		this.setMatrix4(scene.camera.viewMatrix, "view");
		this.setMatrix4(scene.camera.projectionMatrix, "projection");
	}
	public unBindTexture(scene: Scene) {
		const gl = scene.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		this.textures.forEach((binding, index) => {
			binding.texture.unbind(gl, binding.unit ?? index);
		});
		this.defaultTextures.forEach((binding) => {
			binding.texture.unbind(gl, binding.unit);
		});
	}

	public setScene(scene: Scene): void {
		super.setScene(scene);
		this.shader.setScene(scene);
		this.textures.forEach((binding) => binding.texture.setScene(scene));
		this.createDefaultTextures(scene);
	}

	public remove() {
		const gl = this.getGl();
		if (!gl) return this;
		// 只释放材质自身创建的资源：兜底纹理与 shader。
		// this.textures 是外部传入的 Texture，生命周期归创建方（用例层），
		// 材质不代为释放，以免共享纹理被提前销毁。
		// 子类自建的纹理（如 CubeMapMaterial 的立方体贴图）由子类自己释放。
		this.defaultTextures.forEach((binding) => binding.texture.remove());
		this.defaultTextures.length = 0;
		this.shader.remove();
		return this;
	}

	public beforeDraw(scene: Scene, material: Material) {
		void scene;
		void material;
	}

	public afterDraw(scene: Scene, material: Material) {
		void scene;
		void material;
	}
}
export { Material };
export type { MaterialOptions, MaterialTexture };
