const { rm } = require("node:fs/promises");
const { resolve } = require("node:path");
const { cwd } = require("node:process");

async function clearBuildCache() {
	const path = resolve(
		cwd(),
		"./node_modules/.cache/webpack",
	);
	return await rm(path, {
		recursive: true,
		force: true,
	});
}

(async function main() {
	await clearBuildCache();
})();
