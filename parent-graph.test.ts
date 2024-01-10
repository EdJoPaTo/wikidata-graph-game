import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
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

test("3 -> 8", () => {
	deepStrictEqual(intnod(3, [8]), [2]);
});

test("3 -> 8, 10", () => {
	deepStrictEqual(intnod(3, [8, 10]), [2, 6]);
});

test("3 -> 8, 10, 11", () => {
	deepStrictEqual(intnod(3, [8, 10, 11]), [2, 6, 9]);
});
