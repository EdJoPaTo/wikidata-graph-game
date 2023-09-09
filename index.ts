import { type ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import * as store from "./store.ts";
import { getItemParentTaxons } from "./wikidata.ts";

const TARGET = "Q83483"; // sea urchin
const GUESSES = [
	"Q25265", // Felidae (from house cat)
	"Q21179", // Sønderborg
] as const;

async function cacheWithParents(ids: ItemId[]): Promise<void> {
	console.log("cacheWithParents", ids);
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

await cacheWithParents([TARGET, ...GUESSES]);

store.debug();

// console.log(await getEntities([TARGET, ...GUESSES]));
