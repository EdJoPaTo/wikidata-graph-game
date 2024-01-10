import { assertEquals } from "https://deno.land/std@0.211.0/assert/mod.ts";
import { LINKS } from "./dijkstra.test.ts";
import { Graph } from "./graph.ts";
import { getInterestingNodes } from "./parent-graph.ts";

const intnod = (start: number, targets: number[]) =>
	[...getInterestingNodes(LINKS, start, targets)].sort();

export function generateD2(highlights: readonly number[]): void {
	const graph = new Graph();
	for (const [start, end] of LINKS) {
		graph.addLink(String(start), String(end));
	}
	for (const node of highlights) {
		graph.setShape(String(node), "guess");
	}
	const content = graph.buildD2();
	Deno.writeTextFileSync("parent-graph.test.d2", content);
}

// generateD2(intnod(3, [8, 10, 11]));

Deno.test("3 -> 8", () => {
	assertEquals(intnod(3, [8]), [2]);
});

Deno.test("3 -> 8, 10", () => {
	assertEquals(intnod(3, [8, 10]), [2, 6]);
});

Deno.test("3 -> 8, 10, 11", () => {
	assertEquals(intnod(3, [8, 10, 11]), [2, 6, 9]);
});
