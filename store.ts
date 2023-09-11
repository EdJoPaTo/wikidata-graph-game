import { arrayFilterUnique } from "https://esm.sh/array-filter-unique@^3";
import { type Item, type ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { getEntities } from "./wikidata.ts";
import { type SimplifiedItem, simplify } from "./simplify-item.ts";

/// Returns the ItemIds that were missing before the call
export async function cache(ids: readonly ItemId[]): Promise<ItemId[]> {
	const missing = ids
		.filter(arrayFilterUnique())
		.filter((o) => !localStorage.getItem(o));
	if (missing.length > 0) {
		console.log("cache", missing.length, missing);
	}

	const entities = await getEntities(missing);
	const items = Object.values(entities)
		.filter((o): o is Item => o.type === "item")
		.filter(arrayFilterUnique((o) => o.id));
	for (const entity of items) {
		localStorage.setItem(entity.id, JSON.stringify(simplify(entity)));
	}

	return missing;
}

export function tryGet(id: ItemId): SimplifiedItem | undefined {
	const result = localStorage.getItem(id);
	if (!result) return undefined;
	return JSON.parse(result) as SimplifiedItem;
}

export function getCached(id: ItemId): SimplifiedItem {
	const result = tryGet(id);
	if (!result) throw new Error("id not cached: " + id);
	return result;
}
