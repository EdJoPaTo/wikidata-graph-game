import { assertEquals } from "https://deno.land/std@0.211.0/assert/mod.ts";
import {
	dijkstra,
	getClosestParents,
	getParentsCloserThanDistance,
} from "./dijkstra.ts";
import { Graph } from "./graph.ts";

export const LINKS: ReadonlyArray<readonly [number, number]> = [
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

// generateD2();
export function generateD2(): void {
	const graph = new Graph();
	for (const [start, end] of LINKS) {
		graph.addLink(String(start), String(end));
	}
	const content = graph.buildD2();
	Deno.writeTextFileSync("dijkstra.test.d2", content);
}

Deno.test("dijkstra 1", () => {
	const solutions = dijkstra(LINKS, 1);
	assertEquals(solutions.get(20), undefined);
	assertEquals(solutions.get(21), undefined);
	assertEquals(solutions.get(1), [1]);
	assertEquals(solutions.get(2), [1, 2]);
	assertEquals(solutions.get(3), [1, 2, 3]);
	assertEquals(solutions.get(4), [1, 2, 4]);
	assertEquals(solutions.get(5), [1, 5]);
	assertEquals(solutions.get(6), [1, 5, 6]);
	assertEquals(solutions.get(7), [1, 5, 6, 7]);
	assertEquals(solutions.get(8), [1, 5, 6, 7, 8]);
	assertEquals(solutions.get(9), [1, 5, 6, 9]);
	assertEquals(solutions.get(10), [1, 5, 6, 9, 10]);
	assertEquals(solutions.get(11), [1, 5, 6, 9, 11]);
});

Deno.test("dijkstra 8", () => {
	const solutions = dijkstra(LINKS, 8);
	assertEquals(solutions.get(20), undefined);
	assertEquals(solutions.get(21), undefined);
	assertEquals(solutions.get(8), [8]);
	assertEquals(solutions.get(7), [8, 7]);
	assertEquals(solutions.get(6), [8, 7, 6]);
	assertEquals(solutions.get(4), [8, 7, 6, 4]);
	assertEquals(solutions.get(5), [8, 7, 6, 5]);
	assertEquals(solutions.get(9), [8, 7, 6, 9]);
	assertEquals(solutions.get(10), [8, 7, 6, 9, 10]);
	assertEquals(solutions.get(11), [8, 7, 6, 9, 11]);
	assertEquals(solutions.get(1), [8, 7, 6, 5, 1]);
	assertEquals(solutions.get(2), [8, 7, 6, 4, 2]);
	assertEquals(solutions.get(3), [8, 7, 6, 4, 2, 3]);
});

Deno.test("closest from 8", () => {
	assertEquals(getClosestParents(LINKS, 8, [7]), [1, [7]]);
	assertEquals(getClosestParents(LINKS, 8, [6]), [2, [6]]);
	assertEquals(getClosestParents(LINKS, 8, [4]), [3, [4]]);
	assertEquals(getClosestParents(LINKS, 8, [5]), [3, [5]]);
	assertEquals(getClosestParents(LINKS, 8, [4, 5]), [3, [4, 5]]);
	assertEquals(getClosestParents(LINKS, 8, [1, 2]), [4, [2, 1]]);
});

Deno.test("closer than from 8", () => {
	const closer = (maxDistance: number) =>
		getParentsCloserThanDistance(LINKS, 8, maxDistance).sort();

	assertEquals(closer(1), [8]);
	assertEquals(closer(2), [7]);
	assertEquals(closer(3), [6]);
	assertEquals(closer(4), [4, 5]);
	assertEquals(closer(Number.POSITIVE_INFINITY), [1, 2]);
});
