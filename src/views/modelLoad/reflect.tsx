import back from "@/assets/textures/skybox/back.jpg";
import bottom from "@/assets/textures/skybox/bottom.jpg";
import front from "@/assets/textures/skybox/front.jpg";
import left from "@/assets/textures/skybox/left.jpg";
import right from "@/assets/textures/skybox/right.jpg";
import top from "@/assets/textures/skybox/top.jpg";
import {
	AmbientReflectMapMaterial,
	ambientVert,
	Camera,
	CubeMapGeometry,
	CubeMapMaterial,
	FPSControl,
	Geometry,
	GeometryInstance,
	reflectFrag,
	refractFrag,
	Scene,
	Shader,
} from "@/helperv1";
import { SelectOutlined } from "@ant-design/icons";
import { Button, Switch, Upload } from "antd";
import { UploadChangeParam, UploadFile } from "antd/es/upload";
import { mat4, vec3 } from "gl-matrix";
import { useEffect, useRef, useState } from "react";
import { Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);
	const loader = useRef(new GLTFLoader());
	const instancesRef = useRef<GeometryInstance[]>([]);
	const reflectShader = useRef(new Shader(ambientVert, reflectFrag));
	const refractShader = useRef(new Shader(ambientVert, refractFrag));
	const [isReflect, setIsReflect] = useState(true);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const scene = new Scene({
			canvas,
			control: new FPSControl({
				speed: 0.01,
				camera: new Camera({
					far: 2000,
					position: vec3.fromValues(0, 0, 20),
				}),
			}),
		});
		sceneRef.current = scene;

		const skyBox = new CubeMapGeometry({
			material: new CubeMapMaterial({
				cubeMapTextures: [
					{ image: right, width: 2048, height: 2048 },
					{ image: left, width: 2048, height: 2048 },
					{ image: top, width: 2048, height: 2048 },
					{ image: bottom, width: 2048, height: 2048 },
					{ image: front, width: 2048, height: 2048 },
					{ image: back, width: 2048, height: 2048 },
				],
			}),
		});
		scene.add(
			new GeometryInstance({
				geometry: skyBox,
			}),
		);

		return () => {
			try {
				sceneRef.current?.dispatch?.();
			} catch (e) {
				console.log(e);
			} finally {
				sceneRef.current = null;
			}
		};
	}, []);

	async function fileSelectHandle(e: UploadChangeParam<UploadFile<File>>) {
		if (e.file instanceof Blob) {
			const url = URL.createObjectURL(e.file);
			const scene = sceneRef.current;
			if (!scene) return;
			// deref gl，兼容 Scene 实现的 WeakRef
			const gl = scene.gl?.deref();
			if (!gl) {
				console.error("webgl2 context unavailable");
				return;
			}
			const gltf = await loader.current.loadAsync(url);
			const material = new AmbientReflectMapMaterial({
				shader: reflectShader.current,
				cubeMapTextures: [
					{ image: right, width: 2048, height: 2048 },
					{ image: left, width: 2048, height: 2048 },
					{ image: top, width: 2048, height: 2048 },
					{ image: bottom, width: 2048, height: 2048 },
					{ image: front, width: 2048, height: 2048 },
					{ image: back, width: 2048, height: 2048 },
				],
			});
			gltf.scene.traverse((obj) => {
				if (obj instanceof Mesh) {
					const position = obj.geometry.attributes.position;
					const normal = obj.geometry.attributes.normal;
					const uv = obj.geometry.attributes.uv;
					obj.updateMatrixWorld(true);
					// PNT 布局：position(3) + normal(3) + texCoord(2)
					const arr = [];
					for (let i = 0; i < position.count; i++) {
						const x = position.array[i * 3];
						const y = position.array[i * 3 + 1];
						const z = position.array[i * 3 + 2];
						const nx = normal.array[i * 3];
						const ny = normal.array[i * 3 + 1];
						const nz = normal.array[i * 3 + 2];
						const u = uv?.array[i * 2] ?? 0;
						const v = uv?.array[i * 2 + 1] ?? 0;
						arr.push(x, y, z, nx, ny, nz, u, v);
					}
					const attribute = Float32Array.from(arr);
					// 反射材质：cameraPos 必须在 uniformsSetter 中设置，否则反射方向错误

					const geometry = new Geometry({
						material,
						attributes: attribute,
						...(obj.geometry.index ? { indices: obj.geometry.index.array } : {}),
					});
					const matrix = mat4.fromValues(...obj.matrixWorld.elements);
					const geometryInstance = new GeometryInstance({
						geometry,
						matrix,
					});

					instancesRef.current.push(geometryInstance);
					scene.add(geometryInstance);
				}
			});
		}
	}

	function toggleHandle(checked: boolean) {
		setIsReflect(checked);
		// 切换 shader：Shader.render 惰性编译，首次切换后自动编译新 program
		instancesRef.current.forEach((instance) => {
			instance.geometry.material.shader = checked
				? reflectShader.current
				: refractShader.current;
		});
	}

	return (
		<div className={"relative h-full w-full"}>
			<div className="absolute top-4 flex items-center gap-3">
				<Upload accept=".glb" beforeUpload={() => false} onChange={fileSelectHandle}>
					<Button type="primary" icon={<SelectOutlined></SelectOutlined>}>
						选择GLB
					</Button>
				</Upload>
				<Switch
					checked={isReflect}
					checkedChildren="反射"
					unCheckedChildren="折射"
					onChange={toggleHandle}
				/>
			</div>
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
