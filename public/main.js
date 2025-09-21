// deno-lint-ignore no-import-prefix -- Evaluated on web
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs";
import { init } from "./logic.js";

mermaid.initialize({ startOnLoad: false });

export async function drawDiagram(graphDefinition) {
	const element = document.querySelector("#graphDiv");
	const { svg } = await mermaid.render("graphInner", graphDefinition);
	element.innerHTML = svg;
}

init(drawDiagram);
