import {
	type Entity,
	type EntityId,
	isItemId,
	type Item,
	type ItemId,
	type PropertyClaims,
	simplifySparqlResults,
	type SparqlResults,
	WBK,
	type WikibaseEntityIdSnakValue,
} from "https://esm.sh/wikibase-sdk@9.2.2";

const USER_AGENT = "github.com/EdJoPaTo/wikidata-graph-game";
const headers = new Headers();
headers.set("user-agent", USER_AGENT);

export const wdk = WBK({
	instance: "https://www.wikidata.org",
	sparqlEndpoint: "https://query.wikidata.org/sparql",
});

export async function sparqlQuerySimplifiedMinified(
	query: string,
): Promise<string[]> {
	const url = wdk.sparqlQuery(query);
	const response = await fetch(url, { headers });
	const results = await response.json() as SparqlResults;
	return simplifySparqlResults(results, { minimize: true }) as string[];
}

export async function getItemChildren(id: EntityId): Promise<EntityId[]> {
	const query = `SELECT ?item
	WHERE {
		BIND (wd:${id} as ?class)
		{ ?item wdt:P31 ?class. }
		UNION
		{ ?item wdt:P279 ?class. }
	}`;

	const results = await sparqlQuerySimplifiedMinified(query) as EntityId[];
	return results;
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

const INSTANCE_OF = "P31";
const SUBCLASS_OF = "P279";
const PARENT_TAXON = "P171";

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

export function getItemParentTaxons(item: Item): ItemId[] {
	return getWikibaseEntityIdClaimValues(
		item.claims![PARENT_TAXON],
	);
}

export function getItemParents(item: Item): ItemId[] {
	const parentTaxons = getWikibaseEntityIdClaimValues(
		item.claims![PARENT_TAXON],
	);
	if (parentTaxons.length > 0) {
		return parentTaxons;
	}

	return [
		...getWikibaseEntityIdClaimValues(item.claims![INSTANCE_OF]),
		...getWikibaseEntityIdClaimValues(item.claims![SUBCLASS_OF]),
	];
}

export function bestEffortLabel(item: Item): string | undefined {
	const { labels } = item;
	if (!labels) return undefined;
	return labels.de?.value ?? labels.en?.value;
}
