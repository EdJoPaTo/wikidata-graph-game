import {
	type Entity,
	type EntityId,
	isItemId,
	type ItemId,
	type SearchResponse,
	WBK,
} from "https://esm.sh/wikibase-sdk@9.2.2";
import { cache, getCached } from "./store.ts";
import { getItemParents } from "./simplify-item.ts";

const USER_AGENT = "github.com/EdJoPaTo/wikidata-graph-game";
const headers = new Headers();
headers.set("user-agent", USER_AGENT);

export const wdk = WBK({
	instance: "https://www.wikidata.org",
	sparqlEndpoint: "https://query.wikidata.org/sparql",
});

interface RelevantSearchResult {
	id: ItemId;
	taxonName?: string;
	label: string;
	description?: string;
}

export async function search(
	search: string,
	language: string,
): Promise<RelevantSearchResult[]> {
	const url = wdk.searchEntities({
		search: `${search}`,
		language,
		type: "item",
	});
	const response = await fetch(url, { headers });
	const { search: results } = await response.json() as SearchResponse;

	const itemIds = results.map((o) => o.id).filter(isItemId);
	await cache(itemIds);

	const relevant = results.map((o): RelevantSearchResult | undefined => {
		const id = o.id;
		if (!isItemId(id)) return undefined;
		const item = getCached(id);
		if (getItemParents(item).length === 0) return undefined;
		return {
			id,
			taxonName: item.taxonName[0],
			label: o.label,
			description: o.description,
		};
	}).filter((o): o is RelevantSearchResult => o !== undefined);

	return relevant;
}

interface GetEntitiesResponse {
	entities: Record<EntityId, Entity>;
}

export async function getEntities(
	ids: EntityId[],
): Promise<Entity[]> {
	const urls = wdk.getManyEntities({ ids, props: ["claims", "labels"] });
	const jsons = await Promise.all(
		urls.map(async (url) => {
			const response = await fetch(url, { headers });
			const { entities } = await response.json() as GetEntitiesResponse;
			return entities;
		}),
	);
	return jsons.flatMap((entities) => Object.values(entities));
}
