import { resolve } from "node:path";
import { cwd } from "node:process";
import { cpus } from "node:os";

const threadLoader = require("thread-loader");

/**
 * 当前工作目录（根目录）
 */
const CONTEXT = cwd();
/**
 * 用例入口
 */
const EXAMPLE_ENTRY = resolve(__dirname, "src/main.ts");
/**
 * 用例编译输出目录
 */
const EXAMPLE_OUTPUT_PATH = resolve(__dirname, "./dist");
/**
 * html模板
 */
const HTML_TEMPLATE = resolve(
	__dirname,
	"src/public/index.html",
);
/**
 * 需要排除的路径
 */
const EXCLUDE: Array<string | RegExp> = [
	/(node_modules|bower_components)/,
];
/**
 * 边译样式时需要排除的路径
 */
const EXCLUDECSS: Array<string | RegExp> = [...EXCLUDE];
EXCLUDECSS.pop();
/**
 * 多线程加速
 */
const THREAD_LOADER_OPTIONS = {
	workers: Math.floor((cpus().length * 60) / 100),
	workerParallelJobs: 50,
};
threadLoader.warmup(THREAD_LOADER_OPTIONS, [
	"babel-loader",
]);

export {
	EXAMPLE_ENTRY,
	CONTEXT,
	EXAMPLE_OUTPUT_PATH,
	HTML_TEMPLATE,
	THREAD_LOADER_OPTIONS,
	EXCLUDE,
	EXCLUDECSS,
};
