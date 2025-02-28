## 介绍

一个使用webpack作为构建系统，vue作为web框架的基础工程 pnpm9.x || pnpm10.x作为包管理工具。

```shell
git clone xx #本仓库地址
pnpm install #安装依赖
pnpm serve #启动文档服务
```
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
	feat: xxx
	
	1. xxx1

	2. xxx2

	3. xxx3
```
