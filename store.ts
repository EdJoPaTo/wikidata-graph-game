import { arrayFilterUnique } from "array-filter-unique";
import type { Item, ItemId } from "wikibase-sdk";
import { type SimplifiedItem, simplify } from "./simplify-item.ts";
import { getEntities } from "./wikidata.ts";

/// Returns the ItemIds that were missing before the call
export async function cache(ids: readonly ItemId[]): Promise<ItemId[]> {
	const minTimestamp = Date.now() - (1000 * 60 * 30); // 30 min
	const missing = ids
		.filter(arrayFilterUnique())
		.filter((o) => {
			const timestamp = tryGet(o)?.timestamp ?? 0;
			return timestamp < minTimestamp;
		});
	if (missing.length === 0) return [];
	console.log("cache", missing.length, missing);

	const entities = await getEntities(missing);
	const items = Object.values(entities)
		.filter((o): o is Item => o.type === "item")
		.filter(arrayFilterUnique((o) => o.id));
	for (const entity of items) {
		const simplified = JSON.stringify(simplify(entity));
		localStorage.setItem(entity.id, simplified);
		if (entity.redirects?.from) {
			localStorage.setItem(entity.redirects.from, simplified);
		}
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

export function clear(): void {
	localStorage.clear();
}
