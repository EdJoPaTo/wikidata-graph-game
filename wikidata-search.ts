import {
	isItemId,
	type ItemId,
	type SearchResponse,
} from "https://esm.sh/wikibase-sdk@9.2.4";
import { getItemParents } from "./simplify-item.ts";
import { cache, getCached } from "./store.ts";
import { headers, wdk } from "./wikidata.ts";

export async function search(
	search: string,
	language: string,
): Promise<ItemId[]> {
	const url = wdk.searchEntities({
		search: `${search}`,
		language,
		type: "item",
	});
	const response = await fetch(url, { headers });
	const { search: results } = await response.json() as SearchResponse;

	const itemIds = results.map((o) => o.id).filter(isItemId);
	await cache(itemIds);

	return itemIds.filter((id) => {
		const item = getCached(id);
		return getItemParents(item).length > 0;
	});
}
