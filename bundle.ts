import { bundle } from "https://deno.land/x/emit@0.34.0/mod.ts";

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
