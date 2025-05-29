import { Scene } from "./scene.ts";
import { GeometryInstance } from "./geometryInstance.ts";
import { Shader } from "./shader.ts";

interface GeometryOptions {
	attributes: Float32Array;
	indices?: Uint32Array;
	shader: Shader;
	/**
	 * attribute解析方式
	 * @param gl
	 */
	vertexAttribPointer(gl: WebGL2RenderingContext): void;
	texture: Array<{
		image: string;
		width: number;
		height: number;
		textureUnit: number;
		textureLocationName?: string;
	}>;
}

/**
 * 1. 保存 attribute
 * 2. 保存 indices
 * 3. 保存 shader
 * 4. 保存参数解析方式
 * 5. 保存texture
 * 6. calculate model transform matrix
 */
class Geometry {
	constructor(options: GeometryOptions) {
		this.attributes = options.attributes;
		this.indices = options.indices;
		this.shader = options.shader;
		this.vertexAttribPointer = options.vertexAttribPointer;
		const gl = this.shader.gl.deref();
		if (!gl) throw new Error("gl is undefined");
		this.shader.use();
	}
	public attributes: Float32Array;
	public indices?: Uint32Array;
	public shader: Shader;
	public vertexAttribPointer: GeometryOptions["vertexAttribPointer"];
	public render(scene: Scene, instance: GeometryInstance) {}
	private resolveTexture() {}
}

export { Geometry };
