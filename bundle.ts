import { bundle } from "jsr:@deno/emit@0.40";

const { code, map } = await bundle("web.ts", {
	minify: true,
	compilerOptions: {
		inlineSourceMap: true,
		inlineSources: true,
	},
});
await Deno.writeTextFile("public/logic.js", code);
if (map) {
	await Deno.writeTextFile("public/logic.js.map", map);
} else {
	await Deno.remove("public/logic.js.map").catch(() => {});
}
