import {
	type Entity,
	type EntityId,
	type Item,
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

export async function getEntities(
	ids: EntityId[],
): Promise<Record<EntityId, Entity>> {
	const url = wdk.getEntities({ ids });
	const response = await fetch(url, { headers });
	const json = await response.json() as { entities: Record<EntityId, Entity> };
	const entities = json.entities;
	return entities;
}

const INSTANCE_OF = "P31";
const SUBCLASS_OF = "P279";
const PARENT_TAXON = "P171";

function getWikibaseEntityIdClaimValues(o: PropertyClaims | undefined) {
	return (o || [])
		.map((o) => o.mainsnak.datavalue)
		.filter((o): o is WikibaseEntityIdSnakValue =>
			o?.type === "wikibase-entityid"
		)
		.map((o) => o.value.id);
}

export function getItemParents(item: Item): EntityId[] {
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
