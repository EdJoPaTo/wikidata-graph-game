import { arrayFilterUnique } from "https://esm.sh/array-filter-unique@^3";
import { type Item, type ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { getEntities } from "./wikidata.ts";

const store = new Map<ItemId, Item>();

export function load(): void {
	try {
		const items = JSON.parse(Deno.readTextFileSync("store.json")) as Item[];
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
		store.set(entity.id, entity);
	}

	return missing;
}

export async function get(id: ItemId): Promise<Item> {
	if (!store.has(id)) {
		await cache([id]);
	}

	return store.get(id)!;
}

export function getCached(id: ItemId): Item | undefined {
	return store.get(id);
}

export function debug(): void {
	const keys = [...store.keys()];
	console.log("storeDebug", keys.length, keys);
}
