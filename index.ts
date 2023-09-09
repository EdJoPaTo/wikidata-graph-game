import { type ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { getItemParentTaxons } from "./wikidata.ts";
import { Graph } from "./graph.ts";
import * as store from "./store.ts";

const TARGET = "Q83483"; // sea urchin
const GUESSES = [
	"Q25265", // Felidae (from house cat)
	"Q21179", // Sønderborg
] as const;

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

const graph = new Graph();
const added = new Set<ItemId>();

function addParent(id: ItemId) {
	if (added.has(id)) return;
	added.add(id);

	const item = store.getCached(id)!;
	const label = item.labels?.de?.value;
	if (label) {
		graph.setLabel(id, label);
	}

	const parents = getItemParentTaxons(item);
	for (const parent of parents) {
		graph.addLink(parent, id);
		addParent(parent);
	}
}

for (const guess of GUESSES) {
	addParent(guess);
}

Deno.writeTextFileSync("graph.d2", graph.build());
