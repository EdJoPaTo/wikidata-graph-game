import { arrayFilterUnique } from "https://esm.sh/array-filter-unique@^3";
import { type Item, type ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { getEntities } from "./wikidata.ts";
import { type SimplifiedItem, simplify } from "./simplify-item.ts";

const store = new Map<ItemId, SimplifiedItem>();

export function load(): void {
	try {
		const items = JSON.parse(
			Deno.readTextFileSync("store.json"),
		) as SimplifiedItem[];
		for (const item of items) {
			store.set(item.id, item);
		}
	} catch {
		// Ignore missing or unparsable file
	}
}

export function save(): void {
	const items = [...store.values()];
	items.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
	const content = JSON.stringify(items, undefined, "\t") + "\n";
	Deno.writeTextFileSync("store.json", content);
}

/// Returns the ItemIds that were missing before the call
export async function cache(ids: ItemId[]): Promise<ItemId[]> {
	const missing = ids
		.filter((o) => !store.has(o))
		.filter(arrayFilterUnique());
	if (missing.length > 0) {
		console.log("cache", missing.length, missing);
	}

	const entities = await getEntities(missing);
	const items = Object.values(entities)
		.filter((o): o is Item => o.type === "item")
		.filter(arrayFilterUnique((o) => o.id));
	for (const entity of items) {
		store.set(entity.id, simplify(entity));
	}

	return missing;
}

export function getCached(id: ItemId): SimplifiedItem {
	const result = store.get(id);
	if (!result) throw new Error("id not cached: " + id);
	return result;
}
