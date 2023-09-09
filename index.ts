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

store.debug();

const parents = new Map<ItemId, Parents>();
parents.set(TARGET, new Parents(TARGET));
for (const guess of GUESSES) {
	parents.set(guess, new Parents(guess));

	console.log("debug parent", guess);
	parents.get(guess)!.debug();
}
const targetParents = parents.get(TARGET)!;

const graph = new Graph();
const added = new Set<ItemId>();

graph.setShape(TARGET, "hexagon");
graph.setLabel(
	TARGET,
	GUESSES.includes(TARGET)
		? bestEffortLabel(store.getCached(TARGET)!)
		: "guess me",
);

function addGuess(id: ItemId) {
	if (added.has(id)) return;
	console.log("addNode", id, [...added.keys()]);

	const item = store.getCached(id)!;
	graph.setLabel(id, bestEffortLabel(item));

	const idParents = parents.get(id)!;

	{
		const commonParents = idParents.getCommonMinimum(targetParents);
		for (const parent of commonParents) {
			if (parent === id) continue;
			graph.setLabel(parent, bestEffortLabel(store.getCached(parent)!));
			graph.addLink(parent, id);

			graph.addLink(parent, TARGET);
		}
	}

	for (const other of added) {
		if (other === id) continue;
		const otherParents = parents.get(other)!;

		const commonParents = idParents.getCommonMinimum(otherParents);
		for (const parent of commonParents) {
			if (parent === id) continue;
			graph.setLabel(parent, bestEffortLabel(store.getCached(parent)!));
			graph.addLink(parent, id);
		}
	}

	added.add(id);
}

for (const guess of GUESSES) {
	addGuess(guess);
}

Deno.writeTextFileSync("graph.d2", graph.build());
