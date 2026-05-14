# LearnWebGL

学习 OpenGL/WebGL 图形学的 Demo 集合，覆盖从基础三角形到高斯泼溅的完整学习路径。每个 Demo 可独立运行，侧边栏导航切换。

## 快速开始

```bash
git clone https://github.com/MeiYouDu/LearnWebGl.git
pnpm install
pnpm serve       # 启动开发服务器 → http://localhost:2000
pnpm build       # 生产构建
```

## 技术栈

| 层 | 技术 |
|---|---|
| UI 框架 | React 19 + React Router 7 + Ant Design 5 |
| 构建 | Webpack 5 + Babel + TypeScript 5 |
| 3D 渲染 | WebGL2（自研引擎 helperv1）、Three.js（高斯泼溅） |
| 数学 | gl-matrix、mathjs |
| GLSL | `.vert` / `.frag` 通过 webpack-glsl-loader 作为字符串导入 |

## Demo 目录

### 基础

| Demo | 说明 |
|------|------|
| helloWorld | 第一个三角形，直接操作 WebGL2 API |
| texture | 纹理贴图 |
| coordinateSystem | 坐标系变换（model / view / projection） |
| camera | 相机控制 |
| bezierLine | 贝塞尔曲线 |
| quaternion | 欧拉角 vs 四元数旋转对比 |

### 光照

| Demo | 说明 |
|------|------|
| color | 基础颜色 |
| material | Phong 材质模型（ambient / diffuse / specular） |
| lightMap | 光照贴图（漫反射 + 高光贴图） |
| parallelLight | 平行光 |
| pointLight | 点光源 |
| spotLight | 聚光灯 |
| multipleLight | 多光源混合 |

### 高级

| Demo | 说明 |
|------|------|
| depthTest | 深度测试 |
| stencilTest | 模板测试 + 物体描边 |
| blend | 半透明混合，按相机距离排序 |
| faceCulling | 面剔除 |
| frameBuffer | 帧缓冲 + 后处理（反色/锐化/模糊/边缘检测/灰度） |
| cubeMaps | 天空盒 + GLTF 模型加载 |

### 模型加载

| Demo | 说明 |
|------|------|
| load | Three.js 模型加载 |

### 高斯泼溅

| Demo | 说明 |
|------|------|
| GaussianSplats3D | 3D Gaussian Splatting 渲染（@mkkellogg/gaussian-splats-3d） |
| spark | Spark 控件集成 |

## 项目结构

```
src/
├── main.tsx                 # 应用入口
├── views/                   # 各 Demo 页面，按主题分目录
│   ├── fundamentals/        # 基础
│   ├── light/               # 光照
│   ├── advanced/            # 高级
│   ├── gaussian/            # 高斯泼溅
│   └── Root.tsx             # 根布局（Ant Design 导航菜单）
├── routes/                  # 路由定义，每个主题一个文件
├── helperv1/                # 自研 WebGL2 渲染引擎（主力）
├── helper/                  # 旧版 WebGL 辅助库
├── assets/                  # 纹理、天空盒、PBR 材质、模型
├── store/                   # React Context 全局状态（主题）
├── api/                     # axios 请求封装
└── hook/                    # 自定义 hooks
```

## helperv1 自研引擎

项目内置一个轻量 WebGL2 渲染引擎，核心管线：

```
Scene → GeometryInstance × N → Geometry → Material → Shader → GLSL
  │         │                    │            │
  │         └─ matrix (mat4)     ├─ VAO/VBO   ├─ textures[]
  │                              └─ EBO       ├─ uniforms
  └─ Camera + FPSControl                      └─ blend / culling
```

- **Scene**: 管理渲染循环，按 opaque → blend（距离排序）→ post-process 顺序绘制
- **Material**: 持有 Shader、纹理、uniform 回调、混合/剔除开关。子类包括 BlinnPhong、SpotLight、CubeMap、PostProcessing
- **Geometry**: 顶点数据（VAO/VBO/EBO）+ Material 引用
- **GeometryInstance**: 将 Geometry 与一个世界矩阵绑定，支持复用
- **PostProcessingMaterial**: 创建 FBO，渲染到纹理后做全屏后处理（反色、锐化、模糊、边缘检测、灰度）

## TODO

### Bug

- [ ] FBO 不随 resize 更新 — FBO 尺寸未在窗口 resize 时重新创建

### 新功能

- [ ] scene 支持 postUpdate / afterUpdate 回调
- [ ] Material 响应式 uniform 属性，替代每帧 uniformSetter 回调
- [ ] 细分 scene.render() 为子任务管线，提供渲染钩子
- [ ] deltaTime 计算从 getTime() 迁移到 performance.now()
- [ ] 模板测试从 demo 抽离为 Material 属性

## 提交规范

| type     | 描述                                                     |
| -------- | -------------------------------------------------------- |
| feat     | 新增功能                                                 |
| fix      | bug 修复                                                 |
| style    | 不影响程序逻辑的代码修改(修改空白字符，补全缺失的分号等) |
| refactor | 重构代码(既没有新增功能，也没有修复 bug)                 |
| docs     | 文档更新                                                 |
| test     | 增加测试                                                 |
| build    | 构建过程或者工具的变动                                   |
| chore    | 不属于以上类型的变动                                     |

```bash
git commit -m "feat: 新增 xxx 用例"
```
