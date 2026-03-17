// CanvasComponent.tsx
import {
	Scene,
	BlinnPhongMaterial,
	Geometry,
	GeometryInstance,
	Texture as TextureStruct,
} from "@/helperv1"; // 调整路径
import { SelectOutlined } from "@ant-design/icons";
import { Button, Upload } from "antd";
import { UploadChangeParam, UploadFile } from "antd/es/upload";
import { useEffect, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { mat4, vec3 } from "gl-matrix";
import { cos, sin } from "mathjs";
import { Mesh, Texture } from "three";

export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);
	const loader = useRef(new GLTFLoader());

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// create scene (保持与原来一致)
		const scene = new Scene(canvas);
		sceneRef.current = scene;

		return () => {
			try {
				sceneRef.current?.dispatch?.();
			} catch (e) {
				console.log(e);
			} finally {
				sceneRef.current = null;
			}
		};
	}, []); // 仅挂载一次

	async function fileSelectHandle(e: UploadChangeParam<UploadFile<File>>) {
		if (e.file instanceof Blob) {
			const url = URL.createObjectURL(e.file);
			const scene = sceneRef.current;
			if (!scene) return;
			// deref gl，兼容你的 Scene 实现（如果是 WeakRef）
			const gl = scene.gl?.deref();
			if (!gl) {
				console.error("webgl2 context unavailable");
				return;
			}
			const gltf = await loader.current.loadAsync(url);
			gltf.scene.traverse((obj) => {
				if (obj instanceof Mesh) {
					const textures: TextureStruct[] = [];
					if ("material" in obj && obj.material) {
						const map = obj.material.map;
						if (map instanceof Texture) {
							textures.push({
								image: map.source.data,
								width: map.width,
								height: map.height,
								textureUnit: 1,
								textureLocationName: "material.diffuse",
							});
						}
					}
					const position = obj.geometry.attributes.position;
					const normal = obj.geometry.attributes.normal;
					const uv = obj.geometry.attributes.uv;
					obj.updateMatrixWorld(true);
					const arr = [];
					for (let i = 0; i < position.count; i++) {
						const x = position.array[i * 3];
						const y = position.array[i * 3 + 1];
						const z = position.array[i * 3 + 2];
						const nx = normal.array[i * 3];
						const ny = normal.array[i * 3 + 1];
						const nz = normal.array[i * 3 + 2];
						const u = uv.array[i * 2];
						const v = uv.array[i * 2 + 1];
						arr.push(x, y, z, nx, ny, nz, u, v);
					}
					const attribute = Float32Array.from(arr);
					let angle = Date.now() * 0.001;
					let lightPos = vec3.fromValues(sin(angle) * 10, cos(angle) * 10 - 5, 0);
					// shaders
					const material = new BlinnPhongMaterial({
						textures,
						uniformsSetter(glInner: WebGL2RenderingContext, shaderInner) {
							shaderInner.setVec3(scene.camera.position, "cameraPos");
							shaderInner.setVec3(vec3.fromValues(0.6, 0.6, 0.6), "light.ambient");
							shaderInner.setVec3(vec3.fromValues(0.96, 0.96, 0.96), "light.diffuse");
							shaderInner.setVec3(vec3.fromValues(1, 1, 1), "light.specular");
							shaderInner.setVec3(lightPos, "light.position");
							shaderInner.setVec3(
								vec3.fromValues(1.0, 0.5, 0.31),
								"material.ambient",
							);
							shaderInner.setFloat(0.5, "light.constant");
							shaderInner.setFloat(0.045, "light.linear");
							shaderInner.setFloat(0.0075, "light.quadratic");
							shaderInner.setFloat(128.0, "material.shininess");
							angle = Date.now() * 0.001;
							lightPos = vec3.fromValues(sin(angle) * 10, cos(angle) * 10 - 5, 0);
						},
					});
					const boxGeometry = new Geometry({
						material,
						attributes: attribute,
						indices: obj.geometry.index.array,
					});
					const boxGeometryInstance = new GeometryInstance({
						geometry: boxGeometry,
						matrix: mat4.multiply(
							mat4.create(),
							mat4.fromTranslation(mat4.create(), vec3.fromValues(0, 0, 0)),
							mat4.fromScaling(mat4.create(), vec3.fromValues(1.0, 1.0, 1.0)),
						),
					});

					scene.add(boxGeometryInstance);
				}
			});
		}
	}

	// canvas 的样式/属性如需自定义可以把 width/height 作 props
	return (
		<div className={"relative h-full w-full"}>
			<Upload
				className="absolute top-4"
				accept=".glb"
				beforeUpload={() => false}
				onChange={fileSelectHandle}>
				<Button type="primary" icon={<SelectOutlined></SelectOutlined>}>
					选择OBJ
				</Button>
			</Upload>
			<canvas
				ref={canvasRef}
				style={{
					width: "100%",
					height: "100%",
					display: "block",
				}}
			/>
		</div>
	);
}
