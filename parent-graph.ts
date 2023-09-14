import { dijkstra } from "./dijkstra.ts";

/** nodes in the graph where something is branching */
export function getInterestingNodes<T>(
	links: ReadonlyArray<readonly [T, T]>,
	start: T,
	relevantTargets: readonly T[],
): T[] {
	const solutions = dijkstra(links, start);
	const relevantPaths = relevantTargets.map((o) => solutions.get(o) ?? []);
	const relevantNodes = new Set(relevantPaths.flat());
	const relevantLinks = links
		.filter(([a, b]) => relevantNodes.has(a) && relevantNodes.has(b));

	// const l = (node: unknown) =>
	// 	typeof node === "string" && isItemId(node)
	// 		? bestEffortLabel(getCached(node), "de")
	// 		: node;
	// const debug = [...relevantNodes].map((node) => {
	// 	const incoming = relevantLinks
	// 		.filter(([_a, b]) => node === b)
	// 		.map(([a]) => l(a));
	// 	const outgoing = relevantLinks
	// 		.filter(([a, _b]) => node === a)
	// 		.map(([_a, b]) => l(b));
	// 	const label = l(node);

	// 	return { node, incoming, outgoing, label };
	// });
	// Deno.writeTextFileSync(
	// 	"parent-graph.json",
	// 	JSON.stringify(debug, undefined, "\t") + "\n",
	// );

	// Nodes which have not just one incoming and one outgoing connection
	const branches = [...relevantNodes].filter((node) =>
		relevantLinks.filter(([a, _b]) => node === a).length !== 1 ||
		relevantLinks.filter(([_a, b]) => node === b).length !== 1
	);

	return branches;
}
