import { assertEquals } from "https://deno.land/std@0.201.0/assert/mod.ts";
import { Parents } from "./parents.ts";
import { Graph } from "./graph.ts";

const LINKS: ReadonlyArray<readonly [number, number]> = [
	[1, 2],
	[1, 5],
	[2, 3],
	[2, 4],
	[4, 6],
	[5, 6],
	[6, 7],
	[7, 8],
	[6, 9],
	[9, 10],
	[9, 11],
	[20, 21],
];

function getParents(id: number) {
	return LINKS
		.filter(([_start, end]) => end === id)
		.map(([start]) => start);
}

const p = (id: number) => Parents.fromChild(id, getParents);

// generateD2();
export function generateD2(): void {
	const graph = new Graph();
	for (const [start, end] of LINKS) {
		graph.addLink(String(start), String(end));
	}
	const content = graph.buildD2();
	Deno.writeTextFileSync("parents.test.d2", content);
}

Deno.test("common", () => {
	const common = (a: number, b: number) => p(a).getCommon(p(b)).sort();

	assertEquals(common(3, 8), [1, 2]);
	assertEquals(common(3, 10), [1, 2]);

	assertEquals(common(8, 10), [1, 2, 4, 5, 6]);

	assertEquals(common(3, 21), []);
	assertEquals(common(8, 21), []);
	assertEquals(common(10, 21), []);
});

Deno.test("minimum distance", () => {
	const mindist = (id: number, others: readonly number[]) =>
		p(id).getMinimumDistance(others);

	assertEquals(mindist(3, []), []);
	assertEquals(mindist(3, [1]), [1]);
	assertEquals(mindist(3, [2]), [2]);
	assertEquals(mindist(3, [1, 2]), [2]);

	assertEquals(mindist(8, [4]), [4]);
	assertEquals(mindist(8, [6]), [6]);
	assertEquals(mindist(8, [7]), [7]);
	assertEquals(mindist(8, [4, 6]), [6]);
	assertEquals(mindist(8, [4, 6, 7]), [7]);

	assertEquals(mindist(8, [4, 5]), [4, 5]);
});
