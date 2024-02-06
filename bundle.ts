import { bundle } from "https://deno.land/x/emit@0.34.0/mod.ts";

const { code } = await bundle("web.ts", {
	minify: true,
	compilerOptions: {
		inlineSourceMap: true,
		inlineSources: true,
	},
});
await Deno.writeTextFile("public/logic.js", code);
