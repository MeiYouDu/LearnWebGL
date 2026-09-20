# AGENTS.md

学习型 OpenGL/WebGL Demo 工程（React 19 + Webpack 5 + 自研 WebGL2 引擎）。不是业务项目：没有测试，验证靠类型检查/ESLint/构建和浏览器实测。

## 命令

```bash
pnpm install
pnpm serve        # webpack dev server，端口 2000
pnpm build        # 生产构建到 dist/
pnpm lint-fix     # eslint ./ --fix（仓库根，覆盖 .ts/.md/.glsl）
```

- `pnpm test` 是 `exit 1` 占位符，不是有效验证。CI（`.gitlab-ci.yml`）的 test 阶段实际执行 `npx eslint ./src -c ./eslint.config.mjs`。
- 改完先 `pnpm build`：webpack 内置 fork-ts-checker 做类型检查 + eslint 插件，production 下 eslint `failOnError`。
- 改了页面交互或 WebGL 初始化后 `pnpm serve`，在浏览器确认：路由能进、canvas 非空白、控制器可移动/旋转/缩放、切换路由后控制台无 WebGL/context/listener 报错。
- 提交：husky `pre-commit` 跑 lint-staged（eslint + stylelint），`commit-msg` 跑 commitlint，遵循 Conventional Commits（如 `feat: 新增 xxx 用例`）。

## 构建与工程约定

- webpack 配置是 TypeScript，经 ts-node 执行（`TS_NODE_PROJECT=tsconfig-for-webpack-config.json`）；入口、输出目录、HTML 模板路径集中在根 `constant.ts`（根 `*.ts` 也会被 tsconfig 纳入类型检查）。
- 别名 `@/` → `src/`，`@test/` → `test/`（`test/` 目录不存在）。`allowImportingTsExtensions` 已开启，仓库内导入普遍带 `.ts`/`.tsx` 后缀，保持现有风格。
- GLSL（`.glsl`/`.vert`/`.frag`）由 `webpack-glsl-loader` 作为字符串导入；ESLint 与 Prettier（`prettier-plugin-glsl`）也覆盖这些文件。
- 样式：Tailwind 3 + Ant Design 5 + CSS/SCSS；`css-loader` 开启 `modules.auto` 且 `namedExport: true`。
- dev server 带 COOP/COEP 响应头（3DGS 需要 SharedArrayBuffer），并把 `/genie-robot-description`、`/genie_robot_description` 代理到 `https://htrs-geniestudio.agibot.com`（urdfLoader 用例依赖）。
- `.npmrc` 用 npmmirror 镜像；`lerna.json` / `pnpm-workspace.yaml` 里没有 `packages/*`，这是单包工程，不要当 monorepo 处理。
- `cesium` 已安装但 `src/` 无任何引用，CopyWebpackPlugin 中的 cesium 资源拷贝被注释，不要基于它做假设。

## 代码风格

- tab 缩进宽度 4、双引号、分号、`trailingComma: all`、`printWidth: 100`。
- Prettier 启用了 `organize-imports`、`tailwindcss` 插件：导入顺序与 class 排序交给工具，不要手工调整。
- 不要重排大型顶点数组、纹理数据或 shader，这些文件常为教学对照保留结构。
- 维护存量页面时沿用该页面当前的 `helper` 或 `helperv1`，不要顺手大迁移；新增 Demo 用 `helperv1`。

## 目录与路由

```
src/
├── main.tsx          # 入口，挂载 #app，引入 antd React19 patch 与 global.css
├── routes/           # 路由，按主题一个文件，index.ts 汇总后 createBrowserRouter
├── views/            # 页面：fundamentals / light / advanced / modelLoad / gaussian / pointCloud / urdfLoader
├── helperv1/         # 自研 WebGL2 引擎（新代码用这套）
├── helper/           # 旧版封装，仅存量页面使用
└── store/ hook/ api/ utils/ interface/ assets/
```

- 路由懒加载条目固定包含 `hydrateFallbackElement: HydrateFallback` 与 `/* webpackChunkName */`、`/* webpackPrefetch */` 注释，新增时照抄现有条目。
- 导航菜单由 `src/views/Root.tsx` 从 `routes` 里带 `id` 的节点生成：`id` 是菜单文案，菜单项 `key` 是 `path`，选中时按层级拼成跳转地址，所以 `path` 必须能拼出正确路由。
- 页面默认导出 React 组件；例外是 `src/views/gaussian`，路由读取命名导出 `GaussianSplats3DDemo` / `SparkDemo`。
- 新增 Demo：建 `src/views/<topic>/<demo>/index.tsx`，在对应 `src/routes/<topic>.ts` 加懒加载路由，菜单自动出现。
- README 的 Demo 表略有滞后：`@mkkellogg/gaussian-splats-3d` 已不在依赖中，`src/views/gaussian/index.tsx` 里相关代码被注释，当前高斯泼溅走 `@sparkjsdev/spark`。

## helperv1 引擎

- `Scene` 创建 WebGL2 context，用 `WeakRef` 持有 canvas/gl。`render()` 每帧顺序：resize → 更新 deltaTime/控制器/相机矩阵 → 分拣 opaque/blend/postProcess → 绑定后处理 FBO → clear → 不透明 → blend（按相机距离远到近排序）→ 后处理全屏四边形。
- React 页面模式：`useEffect` 内 `new Scene({ canvas, control: new FPSControl({ camera: new Camera() }) })`，卸载时 `scene.dispatch()`（取消 rAF、摘事件监听、释放几何体）。访问 `scene.gl` / `scene.canvas` 前先 `deref()` 判空。
- 增删渲染对象统一用 `scene.add(instance)` / `scene.remove(instance)`。
- `Material.render()` 每帧自动设置 `resolution`、`cameraPos`、`model`、`view`、`projection`；其余 uniform 写在 `uniformsSetter` 回调（每帧调用）。
- `Material.textures` 按数组顺序绑定纹理单元；`Texture.textureUnit` 已 deprecated，不要依赖它。透明材质设 `blend: true`，面剔除设 `culling: true`（由 Scene 统一 enable/disable `CULL_FACE`）。
- 子类 Material 用 `lodash.merge` 合并默认 options；顶点属性解析通过 `vertexAttribPointer` 函数（见 `src/helperv1/utils/vertexAttribPointer.ts`）。
- 新增 shader 的 attribute 名必须匹配解析函数：`position` / `normal` / `texCoord`；stride 分别为 P=3、PN=6、PT=5、PNT=8、postProcessing=4。
- 后处理：把一个 `PostProcessingGeometry`（含 `PostProcessingMaterial`）加入 scene；切换效果先 `scene.remove` 旧实例再 `add` 新实例。已知 bug：FBO 不随窗口 resize 重建（见 README TODO）。

## 静态资源

- 纹理/图片放 `src/assets/image/`、`src/assets/textures/`；天空盒在 `src/assets/textures/skybox/`（顺序 right/left/top/bottom/front/back）；HDR/PBR 在对应子目录；模型在 `src/assets/model/`。
- 小于 128 KiB 的图片会被 webpack 内联成 data URL；`src/assets/data/` 由 CopyWebpackPlugin 原样复制到 `dist/assets/data/`，大文件资源放这里而不是 import。
- `dist/` 是构建产物，不要手改；`node_modules/` 已存在时不要无故重装。
