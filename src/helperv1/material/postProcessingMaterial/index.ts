import { merge } from "lodash";
import { Material, MaterialOptions } from "../baseMaterial";
import vert from "./postProcessing.vert";
import frag from "./postProcessing.frag";
import { GeometryInstance, postProcessingAttribPointer, Scene, Shader } from "../..";

class PostProcessingMaterial extends Material {
	constructor(options?: Partial<MaterialOptions>) {
		const mergedOptions = merge(
			{
				shader: new Shader(vert, frag),
				vertexAttribPointer: postProcessingAttribPointer,
			},
			options,
		);
		super(mergedOptions);
	}

	private texture?: WebGLTexture;

	public setScene(scene: Scene): void {
		super.setScene(scene);
		const gl = this.getGl();
		if (!gl) return;
		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.canvas.width,
			gl.canvas.height,
			0,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			null,
		);
		this.setTextureParams(gl);
		this.setInt(0, "postProcessingTexture");
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			this.texture,
			0,
		);
	}

	public render(scene: Scene, instance: GeometryInstance): void {
		super.render(scene, instance);
		const gl = this.getGl();
		if (!gl) return;
		gl.bindTexture(gl.TEXTURE_2D, this.texture ?? null);
	}
}

export { PostProcessingMaterial };
