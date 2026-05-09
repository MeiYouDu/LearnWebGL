# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

学习 OpenGL/WebGL 的 Demo 项目，包含基础图形学、光照、后处理、模型加载、高斯泼溅等示例。

## 常用命令

```bash
pnpm install          # 安装依赖
pnpm serve            # 启动开发服务器 (webpack dev server)
pnpm build            # 生产构建
pnpm lint-fix         # ESLint 自动修复
```

没有配置实际的测试命令（`pnpm test` 为占位符）。

## 技术栈

- **前端框架**: React 19 + React Router 7 + Ant Design 5
- **构建**: Webpack 5 + Babel + TypeScript 5，webpack 配置文件为 TypeScript（通过 ts-node 执行）
- **包管理器**: pnpm
- **3D 库**: Three.js、Cesium、gl-matrix、mathjs
- **GLSL**: `.vert` / `.frag` 文件通过 `webpack-glsl-loader` 作为字符串导入
- **路径别名**: `@/` → `src/`，`@test/` → `test/`，定义在 `tsconfig.json` 和 `webpack.common.ts`

## 目录架构

```
src/
├── main.tsx              # 应用入口
├── views/                # 各 Demo 页面，按主题分目录
│   ├── fundamentals/     # 基础：helloWorld, texture, camera, quaternion...
│   ├── light/            # 光照：color, material, lightMap, lightCaster...
│   ├── modelLoad/        # 模型加载
│   ├── gaussian/         # 高斯泼溅
│   └── Root.tsx          # 根布局（Ant Design Layout + 导航菜单）
├── routes/               # 路由定义，每个主题一个文件
├── helper/               # 旧版 WebGL 辅助库（简单封装）
├── helperv1/             # 新版自研 WebGL2 渲染引擎（详见下节）
├── store/                # React Context 全局状态
├── api/                  # HTTP 请求封装 (axios)
├── hook/                 # 自定义 hooks
└── assets/               # 纹理、模型等静态资源
```

## helperv1 引擎架构

自研 WebGL2 渲染引擎，类关系如下：

- **`Base`** — 所有引擎对象的基类，通过 `WeakRef` 持有 Scene 引用
- **`Scene`** — 核心调度器：管理 GeometryInstance 集合、驱动渲染循环。`render()` 中按 opaque → blend（远到近排序）→ post-process 的顺序绘制
- **`Shader`** — 编译/链接着色器，`render()` 时创建 program 并 `useProgram`
- **`Material`** (baseMaterial) — 持有 `Shader`、纹理列表、`vertexAttribPointer` 解析函数、`uniformsSetter` 回调。提供 `setMatrix4/setVec3/setInt` 等 uniform 设置方法
  - 子类: `BlinnPhongMaterial`, `SpotLightMaterial`, `CubeMapMaterial`, `PostProcessingMaterial`
- **`Geometry`** — 顶点数据 + `Material`。`setScene()` 时创建 VAO/VBO/EBO，`render()` 绑定 VAO 后委托 Material 绘制
- **`GeometryInstance`** — 将 `Geometry` 与一个世界矩阵 `matrix` 绑定，可多次复用同一 Geometry
- **`Camera`** — 透视相机，`render()` 时更新 view/projection 矩阵
- **`FPSControl`** — FPS 相机控制器，监听键盘(WASD)+鼠标+滚轮，通过四元数更新相机朝向

### 关键约定

- 所有渲染对象通过 `setScene(scene)` 注入场景强引用，基类 `Base` 用 `WeakRef` 持有 Scene
- Material 子类用 `lodash.merge` 合并默认 options，通过 `vertexAttribPointer` 函数定义顶点属性解析方式（见 `utils/vertexAttribPointer.ts`）
- 后处理流程：`PostProcessingMaterial` 创建 FBO → `bind()` 切换渲染目标 → 正常绘制 → `PostProcessingGeometry.render()` 解绑 FBO 并绘制全屏四边形
- `remove()` 方法负责清理 GPU 资源（shader、buffer、texture、FBO），手动调用
