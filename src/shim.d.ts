import type { DefineComponent } from "vue";
import { Doc } from "../constant.ts";

declare global {
	module "*.json" {
		const module: string;
		export default module;
	}
	/**
	 * 解决把scss文件当作模块引入报错的问题，（目前没有想到批量描述export的方式，先这么写）
	 */
	module "*.scss" {
		const styles: Record<string, string>;
		export = styles;
	}
	module "*.css" {
		const styles: Record<string, string>;
		export default styles;
	}
	module "*.jpg" {
		const content: string;
		export default content;
	}
	module "*.png" {
		const content: string;
		export default content;
	}
	module "*.vue" {
		import { DefineComponent } from "vue";
		const component: DefineComponent<any, any, any>;
		export default component;
	}

	interface Process extends NodeJS.Process {
		env: {
			/**
			 * 环境区分
			 */
			NODE_ENV: "development" | "production" | "test";
		};
	}

	module "*.md" {
		const module: string;
		export default module;
	}
	module "*.glsl" {
		const module: string;
		export default module;
	}
	module "*.vert" {
		const module: string;
		export default module;
	}
	module "*.frag" {
		const module: string;
		export default module;
	}

	module "*.mdx" {
		const MDXComponent: (props: any) => JSX.Element;
		export default MDXComponent;
	}
	/**
	 * 文档路径
	 */
	const DOCS: Array<Doc>;
}
