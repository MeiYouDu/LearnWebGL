// CanvasComponent.tsx
import glassImage from "@/assets/textures/grass.png";
import boxImage from "@/assets/textures/marble.jpg";
import groundImage from "@/assets/textures/metal.png";
import back from "@/assets/textures/skybox/back.jpg";
import bottom from "@/assets/textures/skybox/bottom.jpg";
import front from "@/assets/textures/skybox/front.jpg";
import left from "@/assets/textures/skybox/left.jpg";
import right from "@/assets/textures/skybox/right.jpg";
import top from "@/assets/textures/skybox/top.jpg";
import windowImage from "@/assets/textures/window.png";
import {
	BlinnPhongMaterial,
	blinnPhongVert,
	Camera,
	CubeMapGeometry,
	CubeMapMaterial,
	FPSControl,
	Geometry,
	GeometryInstance,
	Material,
	PNTAttribPointer,
	postProcessBlurFrag,
	postProcessDefaultFrag,
	postProcessDefaultVert,
	postProcessEdgeFrag,
	postProcessGrayFrag,
	PostProcessingGeometry,
	PostProcessingMaterial,
	postProcessInversionFrag,
	postProcessSharpenFrag,
	PTAttribPointer,
	Scene,
	Shader,
	Texture as TextureStruct,
} from "@/helperv1";
import { SelectOutlined } from "@ant-design/icons";
import { Button, Checkbox, Select, Switch, Upload, UploadFile } from "antd";
import { UploadChangeParam } from "antd/es/upload";
import { mat4, vec3 } from "gl-matrix";
import { useEffect, useRef, useState } from "react";
import { Mesh, Texture } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import lightFrag from "./light.frag";
import frag from "./texture.frag";
import vert from "./texture.vert";
// attribute 与 Vue 版本保持一致
const boxAttribute = new Float32Array([
	// Back face
	-0.5, -0.5, -0.5, 0, 0, -1, 0.0, 0.0, 0.5, 0.5, -0.5, 0, 0, -1, 1.0, 1.0, 0.5, -0.5, -0.5, 0, 0,
	-1, 1.0, 0.0, 0.5, 0.5, -0.5, 0, 0, -1, 1.0, 1.0, -0.5, -0.5, -0.5, 0, 0, -1, 0.0, 0.0, -0.5,
	0.5, -0.5, 0, 0, -1, 0.0, 1.0,
	// Front face
	-0.5, -0.5, 0.5, 0, 0, 1, 0.0, 0.0, 0.5, -0.5, 0.5, 0, 0, 1, 1.0, 0.0, 0.5, 0.5, 0.5, 0, 0, 1,
	1.0, 1.0, 0.5, 0.5, 0.5, 0, 0, 1, 1.0, 1.0, -0.5, 0.5, 0.5, 0, 0, 1, 0.0, 1.0, -0.5, -0.5, 0.5,
	0, 0, 1, 0.0, 0.0,
	// Left face
	-0.5, 0.5, 0.5, -1, 0, 0, 1.0, 0.0, -0.5, 0.5, -0.5, -1, 0, 0, 1.0, 1.0, -0.5, -0.5, -0.5, -1,
	0, 0, 0.0, 1.0, -0.5, -0.5, -0.5, -1, 0, 0, 0.0, 1.0, -0.5, -0.5, 0.5, -1, 0, 0, 0.0, 0.0, -0.5,
	0.5, 0.5, -1, 0, 0, 1.0, 0.0,
	// Right face
	0.5, 0.5, 0.5, 1, 0, 0, 1.0, 0.0, 0.5, -0.5, -0.5, 1, 0, 0, 0.0, 1.0, 0.5, 0.5, -0.5, 1, 0, 0,
	1.0, 1.0, 0.5, -0.5, -0.5, 1, 0, 0, 0.0, 1.0, 0.5, 0.5, 0.5, 1, 0, 0, 1.0, 0.0, 0.5, -0.5, 0.5,
	1, 0, 0, 0.0, 0.0,
	// Bottom face
	-0.5, -0.5, -0.5, 0, -1, 0, 0.0, 1.0, 0.5, -0.5, -0.5, 0, -1, 0, 1.0, 1.0, 0.5, -0.5, 0.5, 0,
	-1, 0, 1.0, 0.0, 0.5, -0.5, 0.5, 0, -1, 0, 1.0, 0.0, -0.5, -0.5, 0.5, 0, -1, 0, 0.0, 0.0, -0.5,
	-0.5, -0.5, 0, -1, 0, 0.0, 1.0,
	// Top face
	-0.5, 0.5, -0.5, 0, 1, 0, 0.0, 1.0, 0.5, 0.5, 0.5, 0, 1, 0, 1.0, 0.0, 0.5, 0.5, -0.5, 0, 1, 0,
	1.0, 1.0, 0.5, 0.5, 0.5, 0, 1, 0, 1.0, 0.0, -0.5, 0.5, -0.5, 0, 1, 0, 0.0, 1.0, -0.5, 0.5, 0.5,
	0, 1, 0, 0.0, 0.0,
]);

const glassAttribute = new Float32Array([
	-0.5, -0.5, 0.0, 0.0, 0.0, -0.5, 0.5, 0.0, 0.0, 1.0, 0.5, 0.5, 0.0, 1.0, 1.0, -0.5, -0.5, 0.0,
	0.0, 0.0, 0.5, 0.5, 0.0, 1.0, 1.0, 0.5, -0.5, 0.0, 1.0, 0.0,
]);

type EffectType = "default" | "inversion" | "sharpen" | "blur" | "edge" | "gray";

const inversionEffect = new GeometryInstance({
	geometry: new PostProcessingGeometry({
		material: new PostProcessingMaterial({
			shader: new Shader(postProcessDefaultVert, postProcessInversionFrag),
		}),
	}),
});
const kernelEffect = new GeometryInstance({
	geometry: new PostProcessingGeometry({
		material: new PostProcessingMaterial({
			shader: new Shader(postProcessDefaultVert, postProcessSharpenFrag),
		}),
	}),
});
const blurEffect = new GeometryInstance({
	geometry: new PostProcessingGeometry({
		material: new PostProcessingMaterial({
			shader: new Shader(postProcessDefaultVert, postProcessBlurFrag),
		}),
	}),
});
const edgeEffect = new GeometryInstance({
	geometry: new PostProcessingGeometry({
		material: new PostProcessingMaterial({
			shader: new Shader(postProcessDefaultVert, postProcessEdgeFrag),
		}),
	}),
});
const grayEffect = new GeometryInstance({
	geometry: new PostProcessingGeometry({
		material: new PostProcessingMaterial({
			shader: new Shader(postProcessDefaultVert, postProcessGrayFrag),
		}),
	}),
});
const defaultEffect = new GeometryInstance({
	geometry: new PostProcessingGeometry({
		material: new PostProcessingMaterial({
			shader: new Shader(postProcessDefaultVert, postProcessDefaultFrag),
		}),
	}),
});
// 思路
// 1. 设计一个特殊几何体类
// 	1.1. 每次渲染前绑定 frameBuffer
//  1.2. 渲染其他的几何体
//  1.3. 解绑 framebuffer，还原成默认
//  1.4. 将纹理绑定给特殊的几何体，渲染该特殊的几何体
export default function CanvasComponent() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const sceneRef = useRef<Scene | null>(null);
	const intervalRef = useRef<NodeJS.Timeout>(undefined);
	const [enableCullFace] = useState(true);
	const [backCull] = useState(true);
	const needCullMaterial = useRef<Array<Material>>([]);
	const loader = useRef(new GLTFLoader());
	const [currEffect, setCurrEffect] = useState<EffectType>("default");
	let angle = 0;
	const lightPos = vec3.fromValues(Math.cos(angle) * 20, 0, Math.sin(angle) * 20);
	const effects = useRef<
		Array<{
			name: EffectType;
			instance: GeometryInstance;
		}>
	>([
		{
			name: "default",
			instance: defaultEffect,
		},
		{
			name: "gray",
			instance: grayEffect,
		},
		{
			name: "inversion",
			instance: inversionEffect,
		},
		{
			name: "sharpen",
			instance: kernelEffect,
		},
		{
			name: "blur",
			instance: blurEffect,
		},
		{
			name: "edge",
			instance: edgeEffect,
		},
	]);

	function uniformsSetter(shaderInner: Material, lightPos: vec3) {
		shaderInner.setVec3((sceneRef.current as Scene).camera.position, "cameraPos");
		shaderInner.setFloat(0.3, "light.ambient");
		shaderInner.setFloat(0.9, "light.diffuse");
		shaderInner.setFloat(1.0, "light.specular");
		shaderInner.setVec3(lightPos, "light.position");
		shaderInner.setVec3(vec3.fromValues(1.0, 0.5, 0.31), "material.ambient");
		shaderInner.setFloat(1.0, "light.constant");
		shaderInner.setFloat(0.027, "light.linear");
		shaderInner.setFloat(0.0028, "light.quadratic");
		shaderInner.setFloat(128.0, "material.shininess");
	}
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
			let textureUnit = 10;
			gltf.scene.traverse((obj) => {
				if (obj instanceof Mesh) {
					const textures: TextureStruct[] = [];
					if ("material" in obj && obj.material) {
						const map = obj.material.map;
						if (map instanceof Texture) {
							textures.push(
								{
									image: map.source.data,
									width: map.width,
									height: map.height,
									textureUnit: ++textureUnit,
									textureLocationName: "material.diffuse",
								},
								{
									image: map.source.data,
									width: map.width,
									height: map.height,
									textureUnit: ++textureUnit,
									textureLocationName: "material.specular",
								},
							);
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
						const u = uv?.array[i * 2] ?? 0;
						const v = uv?.array[i * 2 + 1] ?? 0;
						arr.push(x, y, z, nx, ny, nz, u, v);
					}
					const attribute = Float32Array.from(arr);
					const material = new BlinnPhongMaterial({
						textures,
						shader: new Shader(blinnPhongVert, frag),
						uniformsSetter: (...[, material]) => uniformsSetter(material, lightPos),
					});
					const boxGeometry = new Geometry({
						material,
						attributes: attribute,
						indices: obj.geometry.index.array,
					});
					const matrix = mat4.fromValues(...obj.matrixWorld.elements);
					const boxGeometryInstance = new GeometryInstance({
						geometry: boxGeometry,
						matrix,
					});

					scene.add(boxGeometryInstance);
				}
			});
		}
	}
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const camera = new Camera();
		// create scene (保持与原来一致)
		const scene = new Scene({
			canvas,
			control: new FPSControl({
				speed: 0.1,
				camera,
			}),
			alpha: true,
		});
		sceneRef.current = scene;
		// deref gl，兼容你的 Scene 实现（如果是 WeakRef）
		const gl = scene.gl?.deref();
		if (!gl) {
			console.error("webgl2 context unavailable");
			return;
		}
		{
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		}
		scene.camera.position = vec3.fromValues(0, 0, 50);

		const boxMaterial = new Material({
			shader: new Shader(vert, frag),
			textures: [
				{
					image: boxImage,
					width: 1024,
					height: 1024,
					textureUnit: 7,
					textureLocationName: "material.diffuse",
				},
				{
					image: boxImage,
					width: 256,
					height: 256,
					textureUnit: 5,
					textureLocationName: "material.specular",
				},
			],
			vertexAttribPointer: PNTAttribPointer,
			uniformsSetter: (...[, material]) => uniformsSetter(material, lightPos),
			culling: true,
		});
		needCullMaterial.current.push(boxMaterial);
		const lightMaterial = new Material({
			shader: new Shader(vert, lightFrag),
			vertexAttribPointer: PNTAttribPointer,
		});
		const glassMaterial = new Material({
			shader: new Shader(vert, frag),
			textures: [
				{
					image: glassImage,
					width: 512,
					height: 512,
					textureUnit: 8,
					textureLocationName: "material.diffuse",
				},
			],
			vertexAttribPointer: PTAttribPointer,
			uniformsSetter: (...[, material]) => uniformsSetter(material, lightPos),
			blend: true,
		});
		const groundMaterial = new Material({
			shader: new Shader(vert, frag),
			textures: [
				{
					image: groundImage,
					width: 1024,
					height: 1024,
					textureUnit: 2,
					textureLocationName: "material.diffuse",
				},
				{
					image: groundImage,
					width: 1024,
					height: 1024,
					textureUnit: 6,
					textureLocationName: "material.specular",
				},
			],
			vertexAttribPointer: PNTAttribPointer,
			uniformsSetter: (...[, material]) => uniformsSetter(material, lightPos),
		});
		const windowMaterial = new Material({
			shader: new Shader(vert, frag),
			textures: [
				{
					image: windowImage,
					width: 256,
					height: 256,
					textureUnit: 3,
					textureLocationName: "material.diffuse",
				},
				{
					image: windowImage,
					width: 256,
					height: 256,
					textureUnit: 4,
					textureLocationName: "material.specular",
				},
			],
			vertexAttribPointer: PTAttribPointer,
			uniformsSetter: (...[, material]) => uniformsSetter(material, lightPos),
			blend: true,
		});
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
		const lightGeometry = new Geometry({
			attributes: boxAttribute,
			material: lightMaterial,
		});
		// geometry & instances
		const boxGeometry = new Geometry({
			attributes: boxAttribute,
			material: boxMaterial,
		});
		const glassGeometry = new Geometry({
			attributes: glassAttribute,
			material: glassMaterial,
		});
		const windowGeometry = new Geometry({
			attributes: glassAttribute,
			material: windowMaterial,
		});
		const groundGeometry = new Geometry({
			attributes: boxAttribute,
			material: groundMaterial,
		});
		const boxGeometryInstance = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(-2, 0, 2)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(2.0, 2.0, 2.0)),
			),
		});
		const skyBoxInstance = new GeometryInstance({
			geometry: skyBox,
		});
		const boxGeometryInstance2 = new GeometryInstance({
			geometry: boxGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(2, 0, 2)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(2.0, 2.0, 2.0)),
			),
		});
		const outline1 = new GeometryInstance({
			geometry: glassGeometry,
			matrix: mat4.mul(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(-2.0, 0, 0.0)),
				mat4.multiply(
					mat4.create(),
					mat4.fromZRotation(mat4.create(), Math.PI),
					mat4.fromScaling(mat4.create(), vec3.fromValues(1, 1, 1)),
				),
			),
		});
		const outline2 = new GeometryInstance({
			geometry: glassGeometry,
			matrix: mat4.mul(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(2.0, 0, -2.0)),
				mat4.multiply(
					mat4.create(),
					mat4.fromZRotation(mat4.create(), Math.PI),
					mat4.fromScaling(mat4.create(), vec3.fromValues(1, 1, 1)),
				),
			),
		});
		const windowInstance = new GeometryInstance({
			geometry: windowGeometry,
			matrix: mat4.mul(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(3.0, 0.0, -4)),
				mat4.multiply(
					mat4.create(),
					mat4.fromXRotation(mat4.create(), 0),
					mat4.fromScaling(mat4.create(), vec3.fromValues(1, 1, 1)),
				),
			),
		});
		const windowInstance2 = new GeometryInstance({
			geometry: windowGeometry,
			matrix: mat4.mul(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(4.0, 0.0, -6.0)),
				mat4.multiply(
					mat4.create(),
					mat4.fromXRotation(mat4.create(), 0),
					mat4.fromScaling(mat4.create(), vec3.fromValues(1, 1, 1)),
				),
			),
		});
		const groundGeometryInstance = new GeometryInstance({
			geometry: groundGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), vec3.fromValues(0, -1, 0)),
				mat4.fromScaling(mat4.create(), vec3.fromValues(100, 1, 100.0)),
			),
		});
		const lightGeometryInstance = new GeometryInstance({
			geometry: lightGeometry,
			matrix: mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), lightPos),
				mat4.fromScaling(mat4.create(), vec3.fromValues(0.5, 0.5, 0.5)),
			),
		});

		scene.add(defaultEffect);
		scene.add(skyBoxInstance);
		scene.add(groundGeometryInstance);
		scene.add(lightGeometryInstance);
		scene.add(boxGeometryInstance);
		scene.add(boxGeometryInstance2);
		scene.add(outline1);
		scene.add(outline2);
		scene.add(windowInstance);
		scene.add(windowInstance2);

		intervalRef.current = setInterval(() => {
			angle = new Date().getTime() * 0.0005;
			lightPos[0] = Math.cos(angle) * 5;
			lightPos[2] = Math.sin(angle) * 5;
			lightGeometryInstance.matrix = mat4.multiply(
				mat4.create(),
				mat4.fromTranslation(mat4.create(), lightPos),
				mat4.fromScaling(mat4.create(), vec3.fromValues(0.5, 0.5, 0.5)),
			);
		}, 16);
		return () => {
			clearInterval(intervalRef.current);
			try {
				sceneRef.current?.dispatch?.();
			} catch (e) {
				console.log(e);
			} finally {
				sceneRef.current = null;
			}
		};
	}, []); // 仅挂载一次

	// canvas 的样式/属性如需自定义可以把 width/height 作 props
	return (
		<div className="relative h-full w-full">
			<div className="absolute left-8 top-8 flex flex-col rounded bg-[rgba(255,255,255,0.5)] p-2">
				<Checkbox
					defaultChecked={enableCullFace}
					onChange={(val) => {
						const gl = sceneRef.current?.gl.deref();
						if (!gl) return;
						needCullMaterial.current.forEach(
							(item) => (item.culling = val.target.checked),
						);
					}}>
					开启面剔除
				</Checkbox>
				<Switch
					defaultChecked={backCull}
					checkedChildren="剔除背面"
					unCheckedChildren="剔除正面"
					onChange={(val) => {
						const gl = sceneRef.current?.gl.deref();
						if (!gl) return;
						if (val) {
							gl.cullFace(gl.BACK);
						} else {
							gl.cullFace(gl.FRONT);
						}
					}}></Switch>
				<Select
					defaultValue={currEffect}
					// effects 在挂载后构建且不再变化，render 读取安全
					// eslint-disable-next-line react-hooks/refs
					options={effects.current.map((item) => {
						return {
							label: item.name,
							value: item.name,
						};
					})}
					onChange={(val) => {
						const last = effects.current.find((item) => item.name === currEffect);
						if (last) sceneRef.current?.remove(last.instance);
						setCurrEffect(val);
						const curr = effects.current.find((item) => item.name === val);
						if (curr) sceneRef.current?.add(curr.instance);
					}}></Select>
				<Upload accept=".glb" beforeUpload={() => false} onChange={fileSelectHandle}>
					<Button type="primary" icon={<SelectOutlined></SelectOutlined>}>
						选择OBJ
					</Button>
				</Upload>
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
