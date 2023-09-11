import {
	type Entity,
	type EntityId,
	isItemId,
	type Item,
	type ItemId,
	type PropertyClaims,
	type SearchResponse,
	type StringSnakValue,
	WBK,
	type WikibaseEntityIdSnakValue,
} from "https://esm.sh/wikibase-sdk@9.2.2";
import { cache, getCached } from "./store.ts";

const SUBCLASS_OF = "P279";
const PARENT_TAXON = "P171";
const TAXON_NAME = "P225";

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
		const item = getCached(id)!;
		if (getItemParents(item).length === 0) return undefined;
		return {
			id,
			taxonName: getTaxonName(item),
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

function getWikibaseEntityIdClaimValues(
	o: PropertyClaims | undefined,
): ItemId[] {
	return (o || [])
		.map((o) => o.mainsnak.datavalue)
		.filter((o): o is WikibaseEntityIdSnakValue =>
			o?.type === "wikibase-entityid"
		)
		.map((o) => o.value.id)
		.filter(isItemId);
}

export function getItemParents(item: Item): ItemId[] {
	const parentTaxons = getWikibaseEntityIdClaimValues(
		item.claims![PARENT_TAXON],
	);
	if (parentTaxons.length > 0) {
		return parentTaxons;
	}

	return getWikibaseEntityIdClaimValues(item.claims![SUBCLASS_OF]);
}

function getTaxonName(item: Item): string | undefined {
	return item.claims?.[TAXON_NAME]
		?.map((o) => o.mainsnak.datavalue)
		.find((o): o is StringSnakValue => o?.type === "string")
		?.value;
}

export function bestEffortLabel(item: Item): string | undefined {
	const taxon = getTaxonName(item);
	const human = item.labels?.de?.value ?? item.labels?.en?.value;

	if (human && taxon) {
		return human === taxon ? taxon : `${taxon} (${human})`;
	}

	if (taxon) {
		return taxon;
	}

	if (human) {
		return human;
	}

	return undefined;
}
