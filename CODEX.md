# CODEX.md

本文件是给 Codex/自动化编码代理使用的工程级说明。进入本仓库后，优先遵循这里的项目约定；如果与用户的明确指令冲突，以用户当前指令为准。

## 项目定位

这是一个学习 OpenGL/WebGL 的 React Demo 工程，主要用于展示基础图形学、纹理、相机、光照、深度/模板/混合/面剔除、帧缓冲、天空盒、模型加载和高斯泼溅等示例。

前端入口是 `src/main.tsx`，路由入口是 `src/routes/index.ts`，根布局是 `src/views/Root.tsx`。Demo 页面集中在 `src/views/` 下，并按主题拆分：

- `src/views/fundamentals/`: 基础示例。
- `src/views/light/`: 光照示例。
- `src/views/advanced/`: 高级 WebGL 示例。
- `src/views/modelLoad/`: glb 模型加载示例。
- `src/views/gaussian/`: Gaussian Splats / Spark 相关示例。

## 常用命令

使用 pnpm，锁文件是 `pnpm-lock.yaml`。

```bash
pnpm install
pnpm serve
pnpm build
pnpm lint-fix
```

- `pnpm serve`: Webpack dev server，默认端口 `2000`，带 COOP/COEP 响应头和 history fallback。
- `pnpm build`: 生产构建到 `dist/`。
- `pnpm lint-fix`: 使用 `eslint.config.mjs` 自动修复。
- `pnpm test`: 当前只是占位命令，会直接失败；不要把它当作有效验证。

提交钩子：

- `.husky/pre-commit` 执行 `pnpm exec lint-staged`。
- `.husky/commit-msg` 执行 commitlint。
- 提交信息遵循 Conventional Commits，例如 `feat(example): 新增 xxx 用例`。

## 技术栈

- React 19、React Router 7、Ant Design 5。
- Webpack 5、Babel、TypeScript 5。
- WebGL2 为主要渲染 API。
- Three.js 用于 glTF/纹理数据辅助和部分 3D 场景。
- `gl-matrix` 是矩阵、向量和四元数的主要数学库。
- GLSL 文件通过 `webpack-glsl-loader` 导入，常见扩展名包括 `.glsl`、`.vert`、`.frag`。
- 样式使用 Tailwind、Ant Design、CSS/SCSS，CSS Modules 由 webpack 的 `css-loader` 自动识别。

路径别名：

- `@/*` 指向 `src/*`。
- `@test/*` 指向 `test/*`。

## 代码风格

- `.editorconfig` 和 Prettier 都使用 tab 缩进，宽度 4。
- 使用双引号、分号、`trailingComma: "all"`、`printWidth: 100`。
- TypeScript 开启 `strict`，改动时尽量保持类型明确。
- 新增源码优先使用 `@/` 别名导入 `src` 内模块。
- 不要无关重排大型顶点数组、纹理数据或 shader 文件；这些文件常常为了教学对照保留结构。
- 如果只维护现有页面，尽量沿用该页面当前使用的 `helper` 或 `helperv1`，不要顺手大迁移。

## 路由与页面约定

路由对象在 `src/routes/*.ts` 中维护，并最终由 `createBrowserRouter(routes)` 创建。页面通常用懒加载：

```ts
{
	path: "cubeMaps",
	id: "cubeMaps",
	hydrateFallbackElement: HydrateFallback,
	lazy: async () => {
		return {
			Component: (
				await import(
					/* webpackChunkName: "cubeMaps" */
					/* webpackPrefetch: true */
					"@/views/advanced/cubeMaps"
				)
			).default,
		};
	},
}
```

导航菜单由 `src/views/Root.tsx` 根据 `routes` 中带 `id` 的节点生成。新增 Demo 时通常需要：

1. 在 `src/views/<topic>/<demo>/` 下增加 `index.tsx` 和必要的 shader/资源。
2. 在对应 `src/routes/<topic>.ts` 添加懒加载路由。
3. 确保页面默认导出 React Component，除非路由明确读取命名导出。

## WebGL 辅助库

项目里有两套自研 WebGL 封装：

- `src/helper/`: 较早版本，`Shader` 构造时需要传入 `gl`，页面通常直接操作 `scene.geometryMap`。
- `src/helperv1/`: 新版本，新增 Demo 优先使用这一套，除非正在维护旧页面。

`helperv1` 关键类：

- `Scene`: 创建 WebGL2 context，管理相机、控制器、渲染循环和 `GeometryInstance` 集合。
- `Camera`: 更新 view/projection 矩阵。
- `FPSControl`: WASD、鼠标拖动、滚轮控制相机，组件卸载时必须通过 `Scene.dispatch()` 清理监听。
- `Shader`: 持有 vertex/fragment 源码，延迟创建并复用 WebGL program。
- `Material`: 持有 shader、纹理、attribute 解析函数、uniform 设置函数，以及 `blend`/`culling` 状态。
- `Geometry`: 持有 attribute、index、material，并创建 VAO/VBO/EBO。
- `GeometryInstance`: 将 `Geometry` 和 model matrix 绑定，可添加到 `Scene`。
- `PostProcessingMaterial` / `PostProcessingGeometry`: 用于 FBO 后处理。
- `CubeMapMaterial` / `CubeMapGeometry`: 用于天空盒。

`Scene.render()` 每帧流程：

1. resize canvas 和 viewport。
2. 更新 deltaTime、控制器和相机矩阵。
3. 拆分不透明、透明和后处理对象。
4. 透明对象按相机距离从远到近排序。
5. 后处理先 bind FBO，再绘制普通对象，最后绘制全屏四边形。

## WebGL 页面生命周期

React 页面通常遵循这个形状：

```tsx
const canvasRef = useRef<HTMLCanvasElement | null>(null);
const sceneRef = useRef<Scene | null>(null);

useEffect(() => {
	const canvas = canvasRef.current;
	if (!canvas) return;

	const scene = new Scene({
		canvas,
		control: new FPSControl({
			camera: new Camera(),
		}),
	});
	sceneRef.current = scene;

	// 创建 Material / Geometry / GeometryInstance，然后 scene.add(instance)

	return () => {
		sceneRef.current?.dispatch?.();
		sceneRef.current = null;
	};
}, []);
```

注意事项：

- 每个页面卸载时清理 `setInterval`/`requestAnimationFrame` 关联资源，并调用 `scene.dispatch()`。
- 访问 `scene.gl`、`scene.canvas` 前先 `deref()` 并判空。
- `helperv1` 中添加对象用 `scene.add(instance)`，移除对象用 `scene.remove(instance)`。
- `Material.uniformsSetter` 每帧执行，适合更新光源、相机位置、时间、材质参数等 uniform。
- `Material` 的 `textures` 在 `helperv1` 中按数组顺序绑定纹理单元；`Texture.textureUnit` 字段标记为 deprecated，不要依赖它控制绑定位置。
- 使用透明纹理时设置 `blend: true`，`Scene` 会延后并排序绘制。
- 需要面剔除时设置 material 的 `culling: true`，具体剔除正面/背面可通过 `gl.cullFace` 调整。
- 使用后处理时，把一个 `PostProcessingGeometry` 实例加入 scene；切换效果时先移除旧实例再添加新实例。

## Shader 与 Attribute 约定

常用 attribute 名称：

- `position`
- `normal`
- `texCoord`

`src/helperv1/utils/vertexAttribPointer.ts` 提供常用解析函数：

- `PAttribPointer`: position，stride 3。
- `PNAttribPointer`: position + normal，stride 6。
- `PTAttribPointer`: position + texCoord，stride 5。
- `PNTAttribPointer`: position + normal + texCoord，stride 8。
- `postProcessingAttribPointer`: 后处理全屏四边形。

新增 shader 时，attribute 名称要和这些解析函数对应。`Material.render()` 会默认设置：

- `resolution`
- `model`
- `view`
- `projection`

其他 uniform 在 `uniformsSetter` 中设置。

## 静态资源

- 普通图片和纹理放在 `src/assets/image/` 或 `src/assets/textures/`。
- 天空盒在 `src/assets/textures/skybox/`，当前顺序通常对应 right、left、top、bottom、front、back。
- HDR/PBR 资源在 `src/assets/textures/hdr/` 和 `src/assets/textures/pbr/`。
- Webpack 会把图片作为 asset 处理，小于 128 KiB 的图片可能内联。

## 验证建议

代码修改后优先运行：

```bash
pnpm build
```

样式或 lint 相关改动可运行：

```bash
pnpm lint-fix
```

如果改了页面交互或 WebGL 初始化，启动：

```bash
pnpm serve
```

然后在浏览器访问 `http://localhost:2000/`，重点检查：

- 页面路由是否能进入。
- canvas 是否非空白。
- 控制器是否能移动/旋转/缩放相机。
- 卸载或切换路由后控制台是否有 WebGL/context/listener 相关报错。
- 新增纹理或 shader uniform 是否正确绑定。

## 已知项目特性

- `dist/` 是构建产物，通常不要手动编辑。
- `node_modules/` 已存在时不要无故重装依赖。
- `src/styles/global.css` 通过 Tailwind base/components/utilities 初始化全局样式，并让 `body`、`#app` 占满视口。
- `Root` 当前使用 Ant Design Layout 和 Menu，菜单折叠状态默认是折叠。
- `hydrateFallbackElement` 统一使用 `src/views/hydrateFallback.tsx`。
