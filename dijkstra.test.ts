import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
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

test("dijkstra 1", () => {
	const solutions = dijkstra(LINKS, 1);
	deepStrictEqual(solutions.get(20), undefined);
	deepStrictEqual(solutions.get(21), undefined);
	deepStrictEqual(solutions.get(1), [1]);
	deepStrictEqual(solutions.get(2), [1, 2]);
	deepStrictEqual(solutions.get(3), [1, 2, 3]);
	deepStrictEqual(solutions.get(4), [1, 2, 4]);
	deepStrictEqual(solutions.get(5), [1, 5]);
	deepStrictEqual(solutions.get(6), [1, 5, 6]);
	deepStrictEqual(solutions.get(7), [1, 5, 6, 7]);
	deepStrictEqual(solutions.get(8), [1, 5, 6, 7, 8]);
	deepStrictEqual(solutions.get(9), [1, 5, 6, 9]);
	deepStrictEqual(solutions.get(10), [1, 5, 6, 9, 10]);
	deepStrictEqual(solutions.get(11), [1, 5, 6, 9, 11]);
});

test("dijkstra 8", () => {
	const solutions = dijkstra(LINKS, 8);
	deepStrictEqual(solutions.get(20), undefined);
	deepStrictEqual(solutions.get(21), undefined);
	deepStrictEqual(solutions.get(8), [8]);
	deepStrictEqual(solutions.get(7), [8, 7]);
	deepStrictEqual(solutions.get(6), [8, 7, 6]);
	deepStrictEqual(solutions.get(4), [8, 7, 6, 4]);
	deepStrictEqual(solutions.get(5), [8, 7, 6, 5]);
	deepStrictEqual(solutions.get(9), [8, 7, 6, 9]);
	deepStrictEqual(solutions.get(10), [8, 7, 6, 9, 10]);
	deepStrictEqual(solutions.get(11), [8, 7, 6, 9, 11]);
	deepStrictEqual(solutions.get(1), [8, 7, 6, 5, 1]);
	deepStrictEqual(solutions.get(2), [8, 7, 6, 4, 2]);
	deepStrictEqual(solutions.get(3), [8, 7, 6, 4, 2, 3]);
});

test("closest from 8", () => {
	deepStrictEqual(getClosestParents(LINKS, 8, [7]), [1, [7]]);
	deepStrictEqual(getClosestParents(LINKS, 8, [6]), [2, [6]]);
	deepStrictEqual(getClosestParents(LINKS, 8, [4]), [3, [4]]);
	deepStrictEqual(getClosestParents(LINKS, 8, [5]), [3, [5]]);
	deepStrictEqual(getClosestParents(LINKS, 8, [4, 5]), [3, [4, 5]]);
	deepStrictEqual(getClosestParents(LINKS, 8, [1, 2]), [4, [2, 1]]);
});

test("closer than from 8", () => {
	const closer = (maxDistance: number) =>
		getParentsCloserThanDistance(LINKS, 8, maxDistance).sort();

	deepStrictEqual(closer(1), [8]);
	deepStrictEqual(closer(2), [7]);
	deepStrictEqual(closer(3), [6]);
	deepStrictEqual(closer(4), [4, 5]);
	deepStrictEqual(closer(Number.POSITIVE_INFINITY), [1, 2]);
});
