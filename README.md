## 介绍

CesiumDrawer 是一个基于 cesium 开发的图形绘制和常用算法库，整个仓库使用 pnpm9.x作为包管理工具。

## 子仓库

- drawer：图形绘制库，包含点线面等基础图形。
- example：用例，文档。
- satellite：卫星相关效果库。
- algorithm：常用算法库。
- cli：CesiumDrawer仓库中使用的命令行工具

## document

目前没有部署官方的文档，但是可以通过源代码编译编译，下面是具体的步骤

```shell
git clone xx #本仓库地址
pnpm install #安装依赖
pnpm serve #启动文档服务
```

访问 http://localhost:1888/ 这个地址，就可以看到文档了。

## 贡献

1. 请先联系喻启萌添加仓库权限
2. git clone仓库后务必使用`pnpm install`进行依赖包的安装
3. 提交信息需要遵循`git commit -m <type>[optional scope]: <description>`的格式
   - type：提交的改动类型（如新增、修改、更新等）
   - optional scope：标识此次提交主要涉及到代码中哪个模块
   - description：一句话描述此次提交的主要内容

### 提交规则

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

### 示例

#### 单条信息

```shell
# “feat”为提交类型，“example”为该提交作用的子工程名称，“新增 xxx 用例”为提交信息
git commit -m "feat(example): 新增 xxx 用例"
```

#### 多条信息

```shell
git commit -e # 该命令将启动 git 的 vim可以增加多条提交
	# vim
	feat(drawer): 爆炸效果

		1. 爆炸效果 class

		2. 支持多重爆炸

		3. 爆炸效果 interface
```
