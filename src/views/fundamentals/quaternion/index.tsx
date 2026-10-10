// quaternion 教学 demo：万向锁对比（左：欧拉角 / 右：四元数）
import boxImage from "@/assets/textures/marble.jpg";
import {
	Camera,
	FPSControl,
	Geometry,
	GeometryInstance,
	Material,
	PNAttribPointer,
	PNTAttribPointer,
	Scene,
	Shader,
	Texture,
} from "@/helperv1";
import { Button, Slider } from "antd";
import { mat4, quat, vec3 } from "gl-matrix";
import { useEffect, useRef, useState } from "react";
import { createBoxPN, createTorus } from "./geometry";
import solidFrag from "./solid.frag";
import solidVert from "./solid.vert";
import frag from "./texture.frag";
import vert from "./texture.vert";

// attribute 与 Vue 版本保持一致（position + normal + texCoord，stride 8）
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

// 万向节圆环尺寸 / 颜色（集中放这里便于微调）
const RING_TUBE = 0.06;
const RING_OUTER_RADIUS = 2.5;
const RING_MID_RADIUS = 2.25;
const RING_INNER_RADIUS = 2.0;
const RING_OUTER_COLOR = vec3.fromValues(0.2, 0.85, 0.95); // 外环：青
const RING_MID_COLOR = vec3.fromValues(0.7, 0.45, 0.95); // 中环：紫
const RING_INNER_COLOR = vec3.fromValues(1.0, 0.6, 0.2); // 内环：橙
const LOCK_COLOR = vec3.fromValues(1.0, 0.25, 0.2); // 万向锁提示红

// 三色坐标轴
const AXIS_X_COLOR = vec3.fromValues(0.95, 0.25, 0.25);
const AXIS_Y_COLOR = vec3.fromValues(0.3, 0.9, 0.4);
const AXIS_Z_COLOR = vec3.fromValues(0.3, 0.55, 1.0);

// 物体变换：立方体 scale 2.0；坐标轴细棒用局部缩放拉长（unit 立方体 [-0.5, 0.5]）
const CUBE_SCALE = mat4.fromScaling(mat4.create(), vec3.fromValues(2, 2, 2));
const AXIS_X_LOCAL = mat4.fromScaling(mat4.create(), vec3.fromValues(1.2, 0.03, 0.03));
const AXIS_Y_LOCAL = mat4.fromScaling(mat4.create(), vec3.fromValues(0.03, 1.2, 0.03));
const AXIS_Z_LOCAL = mat4.fromScaling(mat4.create(), vec3.fromValues(0.03, 0.03, 1.2));

// 万向节三环 base 朝向：圆环几何初始在 XY 平面、法线 +Z，用 base 把环摆成物理万向节姿态。
// 该基底下 pitch=±90° 时外环与中环平面严格共面（对任意 yaw/roll 成立），
// 且内环的转轴会变为世界竖直轴、与外环转轴重合 —— 即锁。
const B_OUTER = mat4.fromXRotation(mat4.create(), -Math.PI / 2); // 外环(yaw)：环平面 XZ
const B_MID = mat4.identity(mat4.create()); // 中环(pitch)：环平面 XY
const B_INNER = mat4.fromYRotation(mat4.create(), Math.PI / 2); // 内环(roll)：环平面 YZ

// 拖拽角速度（度/像素）与自动翻滚步进（度/帧）
const DRAG_DEG_PER_PIXEL = 0.6;
const AUTO_ROLL_DEG_PER_FRAME = 1.2;

// 固定相机：3/4 视角，避免静止时中环 XY 面、内环 YZ 面被看成线；front 指向原点
const CAMERA_POSITION = vec3.fromValues(4.2, -7.5, 3.2);
const CAMERA_UP = vec3.fromValues(0, 0, 1);
// 插值对比时长（毫秒）
const MORPH_MOVE = 2500;
const MORPH_HOLD = 600;

// 滑块配色与左侧三环一一对应：yaw→外环青、pitch→中环紫、roll→内环橙；
// 锁定时 yaw / pitch 转红（与三维里变红的那一对环一致），roll 保持橙色
const SLIDER_ACCENT: Record<"yaw" | "pitch" | "roll", string> = {
	yaw: "#33d9f2",
	pitch: "#b373f2",
	roll: "#ff9933",
};
const SLIDER_LOCK_ACCENT = "#ff4033";

const DEFAULT_CAPTION =
	"万向锁来自『用三个有序角表示姿态』：把同样的三个角塞进四元数乘法，pitch=90° 照样退化。四元数的做法是绕开有序角——轴角直接合成（拖拽 / slerp）。";
const MORPH_CAPTION =
	"同样的起止姿态：欧拉角线性插值绕了 340° 的远路；四元数 slerp 只走 20° 最短弧";

interface DemoKeyframe {
	duration: number;
	from: [number, number, number];
	to: [number, number, number];
	subtitle: string;
	ease: boolean;
}

// 万向锁演示脚本（毫秒时间线，角度单位为度）
const EULER_DEMO_SEGMENTS: DemoKeyframe[] = [
	{
		duration: 1500,
		from: [0, 0, 0],
		to: [0, 90, 0],
		subtitle: "pitch→90°：抬头到底",
		ease: true,
	},
	{
		duration: 500,
		from: [0, 90, 0],
		to: [0, 90, 0],
		subtitle: "pitch→90°：抬头到底",
		ease: false,
	},
	{
		duration: 2500,
		from: [0, 90, 0],
		to: [150, 90, 0],
		subtitle: "yaw→150°：绕世界竖直轴自转",
		ease: true,
	},
	{
		duration: 500,
		from: [150, 90, 0],
		to: [150, 90, 0],
		subtitle: "yaw→150°：绕世界竖直轴自转",
		ease: false,
	},
	{ duration: 800, from: [150, 90, 0], to: [0, 90, 0], subtitle: "", ease: true },
	{
		duration: 2500,
		from: [0, 90, 0],
		to: [0, 90, 150],
		subtitle: "roll→150°：结果完全相同——两轴合一（自由度丢失）",
		ease: true,
	},
	{
		duration: 500,
		from: [0, 90, 150],
		to: [0, 90, 150],
		subtitle: "roll→150°：结果完全相同——两轴合一（自由度丢失）",
		ease: false,
	},
	{ duration: 1000, from: [0, 90, 150], to: [0, 0, 0], subtitle: "", ease: true },
];

/**
 * 固定机位控制器：只把 Scene 交给 control（Scene 构造时强制要求 control），
 * 覆盖 setScene 跳过 addListener，从而不挂任何键鼠监听、保持机位固定。
 */
class StaticControl extends FPSControl {
	public setScene(scene: Scene): void {
		this.scene = new WeakRef(scene);
	}
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function QuaternionDemo() {
	const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const quatTextRef = useRef<HTMLSpanElement | null>(null);

	// 场景初始化在 effect 内完成，UI 通过 ref 调用其中暴露的函数
	const updateEulerRef = useRef<(yaw: number, pitch: number, roll: number) => void>(() => {});
	const stopAllRef = useRef<() => void>(() => {});
	const startEulerDemoRef = useRef<() => void>(() => {});
	const resetEulerRef = useRef<() => void>(() => {});
	const toggleAutoRollRef = useRef<() => void>(() => {});
	const resetQuatRef = useRef<() => void>(() => {});
	const startMorphRef = useRef<() => void>(() => {});

	const [angles, setAngles] = useState({ yaw: 0, pitch: 0, roll: 0 });
	const [eulerSubTitle, setEulerSubTitle] = useState("");
	const [autoRollRunning, setAutoRollRunning] = useState(false);
	const [caption, setCaption] = useState(DEFAULT_CAPTION);

	// 角度变化时同步左面板场景（滑块 / 演示 / 插值都通过它驱动）
	useEffect(() => {
		updateEulerRef.current(angles.yaw, angles.pitch, angles.roll);
	}, [angles]);

	const locked = Math.abs(Math.abs(angles.pitch) - 90) <= 1;
	// 插值对比进行中（仅用于切换底部说明条配色，不参与任何逻辑）
	const morphing = caption === MORPH_CAPTION;

	function handleEulerChange(key: "yaw" | "pitch" | "roll") {
		return (value: number) => {
			// 用户拖动滑块即中止正在进行的演示
			stopAllRef.current();
			setAngles((prev) => ({ ...prev, [key]: value }));
		};
	}

	useEffect(() => {
		const leftCanvas = leftCanvasRef.current;
		const rightCanvas = rightCanvasRef.current;
		if (!leftCanvas || !rightCanvas) return;

		// 固定机位相机：3/4 视角，世界 Z 向上；front = normalize(原点 - position)
		const makeCamera = () => {
			const position = vec3.clone(CAMERA_POSITION);
			const front = vec3.normalize(vec3.create(), vec3.negate(vec3.create(), position));
			const up = vec3.clone(CAMERA_UP);
			return new Camera({ position, front, up });
		};

		const leftScene = new Scene({
			canvas: leftCanvas,
			control: new StaticControl({ camera: makeCamera() }),
			alpha: true,
		});
		const rightScene = new Scene({
			canvas: rightCanvas,
			control: new StaticControl({ camera: makeCamera() }),
			alpha: true,
		});
		// 沿用现有 gl.enable(BLEND) 写法
		[leftScene, rightScene].forEach((scene) => {
			const gl = scene.gl.deref();
			if (!gl) return;
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		});

		const lightPos = vec3.fromValues(4, -8, 10);
		const materialAmbient = vec3.fromValues(1.0, 0.5, 0.31);

		// 每个面板独立创建 Texture / Material（两个 WebGL context 不能共享）
		const leftDiffuse = new Texture({ image: boxImage });
		const leftSpecular = new Texture({ image: boxImage });
		const rightDiffuse = new Texture({ image: boxImage });
		const rightSpecular = new Texture({ image: boxImage });
		const ownedTextures: Texture[] = [leftDiffuse, leftSpecular, rightDiffuse, rightSpecular];

		const makeBoxMaterial = (diffuse: Texture, specular: Texture) =>
			new Material({
				shader: new Shader(vert, frag),
				textures: [
					{ texture: diffuse, unit: 0, name: "material.diffuse" },
					{ texture: specular, unit: 5, name: "material.specular" },
				],
				uniformsSetter: (...[, material]) => {
					material.setFloat(0.7, "light.ambient");
					material.setFloat(0.95, "light.diffuse");
					material.setFloat(1.0, "light.specular");
					material.setVec3(lightPos, "light.position");
					material.setVec3(materialAmbient, "material.ambient");
					material.setFloat(1.0, "light.constant");
					material.setFloat(0.0135, "light.linear");
					material.setFloat(0.0014, "light.quadratic");
					material.setFloat(128.0, "material.shininess");
				},
				culling: true,
			});

		// 纯色材质：颜色在 uniformsSetter 里每帧设置；圆环/坐标轴共用同一份 shader 代码
		const makeSolidMaterial = (color: vec3) =>
			new Material({
				shader: new Shader(solidVert, solidFrag),
				uniformsSetter: (...[, material]) => material.setVec3(color, "color"),
			});

		// geometry & instances（每个 panel 独立创建几何体）
		const axisBox = createBoxPN();
		const leftBoxGeometry = new Geometry({
			attributes: boxAttribute,
			vertexAttribPointer: PNTAttribPointer,
		});
		const rightBoxGeometry = new Geometry({
			attributes: boxAttribute,
			vertexAttribPointer: PNTAttribPointer,
		});
		const leftAxisGeometry = new Geometry({
			attributes: axisBox.attributes,
			vertexAttribPointer: PNAttribPointer,
		});
		const rightAxisGeometry = new Geometry({
			attributes: axisBox.attributes,
			vertexAttribPointer: PNAttribPointer,
		});

		const leftCube = new GeometryInstance({
			geometry: leftBoxGeometry,
			material: makeBoxMaterial(leftDiffuse, leftSpecular),
		});
		const leftAxisX = new GeometryInstance({
			geometry: leftAxisGeometry,
			material: makeSolidMaterial(AXIS_X_COLOR),
		});
		const leftAxisY = new GeometryInstance({
			geometry: leftAxisGeometry,
			material: makeSolidMaterial(AXIS_Y_COLOR),
		});
		const leftAxisZ = new GeometryInstance({
			geometry: leftAxisGeometry,
			material: makeSolidMaterial(AXIS_Z_COLOR),
		});

		// 万向节三环：外环/中环颜色 vec3 可变，锁定时一起改红（共面的那一对）；内环保持原色
		const leftOuterColor = vec3.clone(RING_OUTER_COLOR);
		const leftMidColor = vec3.clone(RING_MID_COLOR);
		const torusOuter = createTorus({ radius: RING_OUTER_RADIUS, tube: RING_TUBE });
		const torusMid = createTorus({ radius: RING_MID_RADIUS, tube: RING_TUBE });
		const torusInner = createTorus({ radius: RING_INNER_RADIUS, tube: RING_TUBE });
		const leftOuter = new GeometryInstance({
			geometry: new Geometry({
				attributes: torusOuter.attributes,
				indices: torusOuter.indices,
				vertexAttribPointer: PNAttribPointer,
			}),
			material: makeSolidMaterial(leftOuterColor),
		});
		const leftMid = new GeometryInstance({
			geometry: new Geometry({
				attributes: torusMid.attributes,
				indices: torusMid.indices,
				vertexAttribPointer: PNAttribPointer,
			}),
			material: makeSolidMaterial(leftMidColor),
		});
		const leftInner = new GeometryInstance({
			geometry: new Geometry({
				attributes: torusInner.attributes,
				indices: torusInner.indices,
				vertexAttribPointer: PNAttribPointer,
			}),
			material: makeSolidMaterial(RING_INNER_COLOR),
		});

		const rightCube = new GeometryInstance({
			geometry: rightBoxGeometry,
			material: makeBoxMaterial(rightDiffuse, rightSpecular),
		});
		const rightAxisX = new GeometryInstance({
			geometry: rightAxisGeometry,
			material: makeSolidMaterial(AXIS_X_COLOR),
		});
		const rightAxisY = new GeometryInstance({
			geometry: rightAxisGeometry,
			material: makeSolidMaterial(AXIS_Y_COLOR),
		});
		const rightAxisZ = new GeometryInstance({
			geometry: rightAxisGeometry,
			material: makeSolidMaterial(AXIS_Z_COLOR),
		});

		leftScene.add(leftCube);
		leftScene.add(leftAxisX);
		leftScene.add(leftAxisY);
		leftScene.add(leftAxisZ);
		leftScene.add(leftOuter);
		leftScene.add(leftMid);
		leftScene.add(leftInner);
		rightScene.add(rightCube);
		rightScene.add(rightAxisX);
		rightScene.add(rightAxisY);
		rightScene.add(rightAxisZ);

		// 左面板：R = Rz(yaw)·Rx(pitch)·Ry(roll)，锁发生在 pitch=±90°
		const updateLeft = (yaw: number, pitch: number, roll: number) => {
			const yawRad = (yaw * Math.PI) / 180;
			const pitchRad = (pitch * Math.PI) / 180;
			const rollRad = (roll * Math.PI) / 180;
			const mz = mat4.fromZRotation(mat4.create(), yawRad);
			const mx = mat4.fromXRotation(mat4.create(), pitchRad);
			const my = mat4.fromYRotation(mat4.create(), rollRad);
			const rotation = mat4.multiply(mat4.create(), mz, mat4.multiply(mat4.create(), mx, my));
			const objectMatrix = mat4.multiply(mat4.create(), rotation, CUBE_SCALE);
			leftCube.matrix = objectMatrix;
			leftAxisX.matrix = mat4.multiply(mat4.create(), objectMatrix, AXIS_X_LOCAL);
			leftAxisY.matrix = mat4.multiply(mat4.create(), objectMatrix, AXIS_Y_LOCAL);
			leftAxisZ.matrix = mat4.multiply(mat4.create(), objectMatrix, AXIS_Z_LOCAL);
			// 万向节：外环只受 yaw、中环受 yaw+pitch、内环受三者影响
			leftOuter.matrix = mat4.multiply(mat4.create(), mz, B_OUTER);
			leftMid.matrix = mat4.multiply(
				mat4.create(),
				mat4.multiply(mat4.create(), mz, mx),
				B_MID,
			);
			leftInner.matrix = mat4.multiply(
				mat4.create(),
				mat4.multiply(mat4.create(), mz, mx),
				mat4.multiply(mat4.create(), my, B_INNER),
			);
			// 万向锁：pitch=±90° 时外环与中环平面共面，用红色提示自由度退化（内环保持原色）
			const isLocked = Math.abs(Math.abs(pitch) - 90) <= 1;
			vec3.copy(leftOuterColor, isLocked ? LOCK_COLOR : RING_OUTER_COLOR);
			vec3.copy(leftMidColor, isLocked ? LOCK_COLOR : RING_MID_COLOR);
		};
		updateEulerRef.current = updateLeft;
		updateLeft(0, 0, 0);

		// 右面板：姿态由单位四元数驱动，matrix = scale(2) · fromQuat(q)
		const currentQuat = quat.create();
		const updateQuatText = (q: quat) => {
			if (!quatTextRef.current) return;
			quatTextRef.current.textContent = `(${q[0].toFixed(4)}, ${q[1].toFixed(4)}, ${q[2].toFixed(4)}, ${q[3].toFixed(4)})`;
		};
		const applyRightQuat = (q: quat) => {
			const rotation = mat4.fromQuat(mat4.create(), q);
			const objectMatrix = mat4.multiply(mat4.create(), rotation, CUBE_SCALE);
			rightCube.matrix = objectMatrix;
			rightAxisX.matrix = mat4.multiply(mat4.create(), objectMatrix, AXIS_X_LOCAL);
			rightAxisY.matrix = mat4.multiply(mat4.create(), objectMatrix, AXIS_Y_LOCAL);
			rightAxisZ.matrix = mat4.multiply(mat4.create(), objectMatrix, AXIS_Z_LOCAL);
			updateQuatText(q);
		};
		applyRightQuat(currentQuat);

		// 同一时间只允许一个演示：这里统一停止全部 rAF 并复位文案
		let leftRaf = 0;
		let autoRaf = 0;
		let morphRaf = 0;
		const cancelAllRaf = () => {
			if (leftRaf) {
				cancelAnimationFrame(leftRaf);
				leftRaf = 0;
			}
			if (autoRaf) {
				cancelAnimationFrame(autoRaf);
				autoRaf = 0;
			}
			if (morphRaf) {
				cancelAnimationFrame(morphRaf);
				morphRaf = 0;
			}
		};
		const stopAll = () => {
			cancelAllRaf();
			setAutoRollRunning(false);
			setEulerSubTitle("");
			setCaption(DEFAULT_CAPTION);
		};
		stopAllRef.current = stopAll;

		// 左：万向锁演示脚本（rAF 时间线，受控滑块随动画更新）
		const startEulerDemo = () => {
			stopAll();
			const startTime = performance.now();
			const total = EULER_DEMO_SEGMENTS.reduce((sum, seg) => sum + seg.duration, 0);
			const tick = (now: number) => {
				const elapsed = now - startTime;
				if (elapsed >= total) {
					setAngles({ yaw: 0, pitch: 0, roll: 0 });
					setEulerSubTitle("");
					leftRaf = 0;
					return;
				}
				let acc = 0;
				let seg = EULER_DEMO_SEGMENTS[EULER_DEMO_SEGMENTS.length - 1];
				let local = 0;
				for (const item of EULER_DEMO_SEGMENTS) {
					if (elapsed < acc + item.duration) {
						seg = item;
						local = (elapsed - acc) / item.duration;
						break;
					}
					acc += item.duration;
				}
				const k = seg.ease ? easeInOut(local) : local;
				setEulerSubTitle(seg.subtitle);
				setAngles({
					yaw: seg.from[0] + (seg.to[0] - seg.from[0]) * k,
					pitch: seg.from[1] + (seg.to[1] - seg.from[1]) * k,
					roll: seg.from[2] + (seg.to[2] - seg.from[2]) * k,
				});
				leftRaf = requestAnimationFrame(tick);
			};
			leftRaf = requestAnimationFrame(tick);
		};
		startEulerDemoRef.current = startEulerDemo;

		const resetEuler = () => {
			stopAll();
			setAngles({ yaw: 0, pitch: 0, roll: 0 });
		};
		resetEulerRef.current = resetEuler;

		// 右：自动翻滚（从当前 q 起，每帧绕 (1,1,1) 增量旋转）；再点停止
		const toggleAutoRoll = () => {
			if (autoRaf) {
				stopAll();
				return;
			}
			stopAll();
			setAutoRollRunning(true);
			const axis = vec3.normalize(vec3.create(), vec3.fromValues(1, 1, 1));
			const delta = quat.create();
			const step = (AUTO_ROLL_DEG_PER_FRAME * Math.PI) / 180;
			const tick = () => {
				quat.setAxisAngle(delta, axis, step);
				quat.multiply(currentQuat, delta, currentQuat);
				quat.normalize(currentQuat, currentQuat);
				applyRightQuat(currentQuat);
				autoRaf = requestAnimationFrame(tick);
			};
			autoRaf = requestAnimationFrame(tick);
		};
		toggleAutoRollRef.current = toggleAutoRoll;

		const resetQuat = () => {
			stopAll();
			quat.identity(currentQuat);
			applyRightQuat(currentQuat);
		};
		resetQuatRef.current = resetQuat;

		// 全局插值对比：A=(yaw 170°)、B=(yaw -170°)
		const startMorph = () => {
			stopAll();
			setCaption(MORPH_CAPTION);
			setAngles({ yaw: 170, pitch: 0, roll: 0 });
			const zAxis = vec3.fromValues(0, 0, 1);
			const quatA = quat.setAxisAngle(quat.create(), zAxis, (170 * Math.PI) / 180);
			const quatB = quat.setAxisAngle(quat.create(), zAxis, (-170 * Math.PI) / 180);
			const tmp = quat.create();
			const target = quat.create();
			const startTime = performance.now();
			const cycle = (MORPH_MOVE + MORPH_HOLD) * 2;
			const tick = (now: number) => {
				const phase = (now - startTime) % cycle;
				let u: number;
				let forward: boolean;
				if (phase < MORPH_MOVE) {
					u = phase / MORPH_MOVE;
					forward = true;
				} else if (phase < MORPH_MOVE + MORPH_HOLD) {
					u = 1;
					forward = true;
				} else if (phase < MORPH_MOVE * 2 + MORPH_HOLD) {
					u = (phase - MORPH_MOVE - MORPH_HOLD) / MORPH_MOVE;
					forward = false;
				} else {
					u = 1;
					forward = false;
				}
				// 左：角度三元组线性插值（170°→-170° 走远路，视觉共 340°），滑块随动
				const yaw = forward ? 170 - 340 * u : -170 + 340 * u;
				setAngles({ yaw, pitch: 0, roll: 0 });
				// 右：四元数 slerp（走最短弧 20°）
				const fromQ = forward ? quatA : quatB;
				const toQ = forward ? quatB : quatA;
				quat.copy(target, toQ);
				// 短弧：q 与 -q 表示同一姿态，dot<0 时取反目标，保证 slerp 走 <180° 的弧
				if (quat.dot(fromQ, target) < 0) quat.scale(target, target, -1);
				quat.slerp(tmp, fromQ, target, u);
				applyRightQuat(tmp);
				morphRaf = requestAnimationFrame(tick);
			};
			morphRaf = requestAnimationFrame(tick);
		};
		startMorphRef.current = startMorph;

		// 右画布拖拽自由翻滚：增量 (dx,dy) 映射为绕屏幕轴旋转
		let dragging = false;
		let lastX = 0;
		let lastY = 0;
		const onPointerDown = (ev: PointerEvent) => {
			stopAll();
			dragging = true;
			lastX = ev.clientX;
			lastY = ev.clientY;
			rightCanvas.setPointerCapture(ev.pointerId);
		};
		const onPointerMove = (ev: PointerEvent) => {
			if (!dragging) return;
			const dx = ev.clientX - lastX;
			const dy = ev.clientY - lastY;
			lastX = ev.clientX;
			lastY = ev.clientY;
			const dist = Math.hypot(dx, dy);
			if (dist < 1e-6) return;
			// 相机右方向 / 上方向（固定机位下不随拖拽变化）；camRight = cross(front, up)
			const camRight = vec3.normalize(
				vec3.create(),
				vec3.cross(vec3.create(), rightScene.camera.front, rightScene.camera.up),
			);
			const camUp = vec3.normalize(vec3.create(), rightScene.camera.up);
			const axis = vec3.create();
			vec3.scale(axis, camRight, dy);
			vec3.add(axis, axis, vec3.scale(vec3.create(), camUp, dx));
			vec3.normalize(axis, axis);
			const angle = (dist * DRAG_DEG_PER_PIXEL * Math.PI) / 180;
			const delta = quat.setAxisAngle(quat.create(), axis, angle);
			// 左乘 = 绕世界（屏幕）轴旋转，物体跟随指针
			quat.multiply(currentQuat, delta, currentQuat);
			quat.normalize(currentQuat, currentQuat);
			applyRightQuat(currentQuat);
		};
		const onPointerUp = (ev: PointerEvent) => {
			dragging = false;
			if (rightCanvas.hasPointerCapture(ev.pointerId))
				rightCanvas.releasePointerCapture(ev.pointerId);
		};
		rightCanvas.addEventListener("pointerdown", onPointerDown);
		rightCanvas.addEventListener("pointermove", onPointerMove);
		rightCanvas.addEventListener("pointerup", onPointerUp);
		rightCanvas.addEventListener("pointercancel", onPointerUp);

		return () => {
			cancelAllRaf();
			rightCanvas.removeEventListener("pointerdown", onPointerDown);
			rightCanvas.removeEventListener("pointermove", onPointerMove);
			rightCanvas.removeEventListener("pointerup", onPointerUp);
			rightCanvas.removeEventListener("pointercancel", onPointerUp);
			try {
				leftScene.dispatch();
				rightScene.dispatch();
			} catch (e) {
				console.log(e);
			} finally {
				ownedTextures.forEach((texture) => texture.remove());
			}
		};
	}, []); // 仅挂载一次

	return (
		<div className="relative flex h-full w-full overflow-hidden">
			{/* 覆盖层动画与滑块手柄中性化（纯视觉，无副作用）：徽章/文案入场、锁定脉冲 */}
			<style>{`
				@keyframes quatFadeIn {
					from {
						opacity: 0;
						transform: translateY(-4px) scale(0.97);
					}
					to {
						opacity: 1;
						transform: none;
					}
				}
				@keyframes quatCaptionIn {
					from {
						opacity: 0;
						transform: translateY(3px);
					}
					to {
						opacity: 1;
						transform: none;
					}
				}
				@keyframes quatPulse {
					0%,
					100% {
						opacity: 1;
					}
					50% {
						opacity: 0.35;
					}
				}
				.quat-fade-in {
					animation: quatFadeIn 0.28s cubic-bezier(0.2, 0.7, 0.3, 1) both;
				}
				.quat-caption-in {
					animation: quatCaptionIn 0.28s ease-out both;
				}
				.quat-pulse {
					animation: quatPulse 1.5s ease-in-out infinite;
				}
				/* 玻璃卡：稍高的不透明度 + 极淡内衬高光，压住视口里亮环透出的"脏感"，同时保留磨砂观感 */
				.quat-card {
					background:
						linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 42%),
						rgba(9, 12, 16, 0.88);
				}
				/* 手柄默认蓝环在深色面板上突兀，统一改成中性白环 */
				.quat-panel .ant-slider-handle::after {
					background-color: #0b0f14;
					box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85);
				}
				.quat-panel .ant-slider-handle:hover::after,
				.quat-panel .ant-slider-handle:focus::after {
					box-shadow:
						0 0 0 2px #0b0f14,
						0 0 0 4px rgba(255, 255, 255, 0.9);
				}
			`}</style>

			{/* 左：欧拉角（警示色系，锁定即转红） */}
			<div className="relative h-full w-1/2 border-r border-white/20">
				<canvas ref={leftCanvasRef} className="block h-full w-full" />
				<div
					className={`quat-panel quat-card absolute left-4 top-4 flex w-80 flex-col gap-3 rounded-2xl border p-4 text-white backdrop-blur-md transition-all duration-300 ${
						locked
							? "border-red-500/40 shadow-[0_0_0_1px_rgba(239,68,68,0.35),0_10px_40px_rgba(127,29,29,0.5)]"
							: "border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
					}`}>
					<div className="flex items-center gap-2">
						<span
							className={`h-2 w-2 shrink-0 rounded-full transition-colors duration-300 ${
								locked
									? "quat-pulse bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.9)]"
									: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
							}`}
						/>
						<h2 className="text-sm font-semibold tracking-wide">
							欧拉角 <span className="font-normal text-white/45">Euler</span>
						</h2>
					</div>
					{(["yaw", "pitch", "roll"] as const).map((key) => {
						const accent =
							locked && key !== "roll" ? SLIDER_LOCK_ACCENT : SLIDER_ACCENT[key];
						return (
							<div key={key} className="flex items-center gap-2">
								<span className="w-12 shrink-0 text-[11px] font-medium tracking-wider text-white/55">
									{key}
								</span>
								{/* tooltip 的 Portal 一旦挂载，受控值被脚本/拖拽以 rAF 频率更新时会触发 rc-trigger 更新回环崩溃；数值标签已常显，故禁用 */}
								<Slider
									className="flex-1"
									min={-180}
									max={180}
									step={1}
									value={angles[key]}
									onChange={handleEulerChange(key)}
									tooltip={{ open: false }}
									railStyle={{ background: "rgba(255,255,255,0.14)" }}
									trackStyle={{ background: accent }}
								/>
								<span
									className="w-12 shrink-0 text-right font-mono text-xs tabular-nums transition-colors duration-300"
									style={{ color: accent }}>
									{angles[key].toFixed(0)}°
								</span>
							</div>
						);
					})}
					<div className="mt-0.5 flex gap-2">
						<Button
							size="small"
							color="orange"
							variant="solid"
							className="!font-semibold !text-amber-950"
							onClick={() => startEulerDemoRef.current()}>
							▶ 演示万向锁
						</Button>
						<Button size="small" ghost onClick={() => resetEulerRef.current()}>
							复位
						</Button>
					</div>
					{/* 常驻占位，避免副标题出现 / 消失时卡片高度跳动 */}
					<div className="min-h-4 text-xs font-medium leading-4 text-sky-300">
						{eulerSubTitle}
					</div>
					{locked ? (
						<div className="quat-fade-in rounded-lg border border-red-400/40 bg-red-500/15 p-2.5 text-xs text-red-50 backdrop-blur-sm">
							<div className="flex items-center gap-1.5 font-semibold text-red-200">
								<span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]" />
								万向锁：自由度 3 → 2
							</div>
							<div className="mt-1 leading-relaxed text-red-100/85">
								外环与中环已合成同一平面；内环转轴与外环重合（都绕世界竖直轴）——yaw
								与 roll 等效
							</div>
						</div>
					) : null}
				</div>
			</div>

			{/* 右：四元数（正色系，呼应"自由"） */}
			<div className="relative h-full w-1/2">
				<canvas
					ref={rightCanvasRef}
					className="block h-full w-full"
					style={{ touchAction: "none" }}
				/>
				<div className="quat-panel quat-card absolute left-4 top-4 flex w-80 flex-col gap-2.5 rounded-2xl border border-cyan-400/20 p-4 text-white shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
						<h2 className="text-sm font-semibold tracking-wide">
							四元数 <span className="font-normal text-white/45">Quaternion</span>
						</h2>
					</div>
					{/* 单行不换行：11px 等宽 + 收紧字距，最坏符号情形（4 个负值）也能完整放下，内框高度恒定 */}
					<div className="whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 font-mono text-[11px] leading-4 tracking-tight tabular-nums text-cyan-100">
						<span className="text-white/40">q = </span>
						<span ref={quatTextRef} />
					</div>
					<div className="flex items-start gap-1.5 text-xs leading-relaxed text-white/45">
						<span className="mt-px shrink-0 rounded border border-white/25 bg-white/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white/80">
							拖拽
						</span>
						<span>在画布上拖拽可绕屏幕轴自由翻滚</span>
					</div>
					<div className="mt-0.5 flex gap-2">
						<Button
							size="small"
							color={autoRollRunning ? "red" : "cyan"}
							variant="solid"
							className={
								autoRollRunning ? "!font-semibold" : "!font-semibold !text-cyan-950"
							}
							onClick={() => toggleAutoRollRef.current()}>
							{autoRollRunning ? "⏸ 停止翻滚" : "▶ 自动翻滚"}
						</Button>
						<Button size="small" ghost onClick={() => resetQuatRef.current()}>
							复位
						</Button>
					</div>
				</div>
			</div>

			{/* 底部：插值对比 */}
			<div
				className={`quat-card absolute bottom-4 left-1/2 flex w-[min(760px,90%)] -translate-x-1/2 flex-col items-center gap-3 rounded-2xl border p-4 text-center text-white shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-md transition-colors duration-300 ${
					morphing ? "border-cyan-400/30" : "border-white/10"
				}`}>
				<Button size="small" type="primary" onClick={() => startMorphRef.current()}>
					▶ 插值对比 A⇄B
				</Button>
				<div
					key={caption}
					className={`quat-caption-in text-xs leading-relaxed ${
						morphing ? "text-cyan-100/90" : "text-white/75"
					}`}>
					{caption}
				</div>
			</div>
		</div>
	);
}
