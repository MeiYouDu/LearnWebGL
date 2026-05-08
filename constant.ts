import { cpus } from "node:os";
import { resolve } from "node:path";
import { cwd } from "node:process";

// const threadLoader = require("thread-loader");

/**
 * 当前工作目录（根目录）
 */
const CONTEXT = cwd();
/**
 * 用例入口
 */
const EXAMPLE_ENTRY = resolve(__dirname, "src/main.tsx");
/**
 * 用例编译输出目录
 */
const EXAMPLE_OUTPUT_PATH = resolve(__dirname, "./dist");
/**
 * html模板
 */
const HTML_TEMPLATE = resolve(__dirname, "src/public/index.html");
/**
 * 需要排除的路径
 */
const EXCLUDE: Array<string | RegExp> = [/(node_modules|bower_components)/];
/**
 * 边译样式时需要排除的路径
 */
const EXCLUDECSS: Array<string | RegExp> = [...EXCLUDE];
EXCLUDECSS.pop();
/**
 * 多线程加速
 */
const THREAD_LOADER_OPTIONS = {
	workers: cpus().length - 1,
	workerParallelJobs: 50,
	poolRespawn: true,
	poolTimeout: 1000,
};
// threadLoader.warmup(THREAD_LOADER_OPTIONS, [
// 	"babel-loader",
// 	"vue-loader",
// 	"sass-loader",
// ]);

export {
	CONTEXT,
	EXAMPLE_ENTRY,
	EXAMPLE_OUTPUT_PATH,
	EXCLUDE,
	EXCLUDECSS,
	HTML_TEMPLATE,
	THREAD_LOADER_OPTIONS,
};
