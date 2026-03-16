import { Scene } from "./scene";

class Base {
	protected scene?: WeakRef<Scene>;
	public setScene(scene: Scene) {
		this.scene = new WeakRef(scene);
	}
	public getScene(): Scene | undefined {
		return this.scene?.deref();
	}
	public getGl(): WebGL2RenderingContext | undefined {
		return this.scene?.deref()?.gl.deref();
	}
}
export { Base };
