import { type ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { bestEffortLabel, getItemParentTaxons } from "./wikidata.ts";
import { Graph } from "./graph.ts";
import { Parents } from "./parents.ts";
import * as store from "./store.ts";

const TARGET = "Q83483"; // sea urchin
const GUESSES: readonly ItemId[] = [
	"Q25265", // Felidae (from house cat)
	"Q140", // lion
	"Q11687", // Springspinne
	"Q611843", // Octopus
];

async function cacheWithParents(ids: ItemId[]): Promise<void> {
	const missing = await store.cache(ids);
	const next: ItemId[] = [];
	for (const id of missing) {
		const parents = getItemParentTaxons(store.getCached(id)!);
		next.push(...parents);
	}
	if (next.length > 0) {
		await cacheWithParents(next);
	}
}

store.load();
await cacheWithParents([TARGET, ...GUESSES]);
store.save();

const graph = new Graph();
const interesting = new Set<ItemId>([TARGET, ...GUESSES]);

for (const aId of interesting) {
	const aParents = new Parents(aId);
	for (const bId of interesting) {
		if (aId === bId) continue;
		const bParents = new Parents(bId);
		const commonParents = aParents.getCommonMinimumDistance(bParents);
		for (const parent of commonParents) {
			interesting.add(parent);
		}
	}
}

for (const id of interesting) {
	const item = store.getCached(id)!;
	graph.setLabel(id, bestEffortLabel(item));

	const parents = new Parents(id).getMinimumDistance(
		[...interesting].filter((o) => o !== id),
	);
	for (const parent of parents) {
		graph.addLink(parent, id);
	}
}

for (const id of GUESSES) {
	graph.setShape(id, "oval");
}

graph.setShape(TARGET, "hexagon");
graph.setLabel(
	TARGET,
	GUESSES.includes(TARGET)
		? bestEffortLabel(store.getCached(TARGET)!)
		: "guess me",
);

Deno.writeTextFileSync("graph.d2", graph.build());
