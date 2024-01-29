import {
	type Entity,
	type EntityId,
	simplifySparqlResults,
	type SparqlResults,
	WBK,
} from "https://esm.sh/wikibase-sdk@9.2.4";

const USER_AGENT = "github.com/EdJoPaTo/wikidata-graph-game";
export const headers = new Headers();
headers.set("user-agent", USER_AGENT);

export const wdk = WBK({
	instance: "https://www.wikidata.org",
	sparqlEndpoint: "https://query.wikidata.org/sparql",
});

interface GetEntitiesResponse {
	entities: Record<EntityId, Entity>;
}

export async function getEntities(
	ids: EntityId[],
): Promise<Entity[]> {
	const urls = wdk.getManyEntities({
		ids,
		props: ["labels", "descriptions", "claims"],
	});
	const jsons = await Promise.all(
		urls.map(async (url) => {
			const response = await fetch(url, { headers });
			const { entities } = await response.json() as GetEntitiesResponse;
			return entities;
		}),
	);
	return jsons.flatMap((entities) => Object.values(entities));
}

export async function sparqlQuerySimplifiedMinified(
	query: string,
): Promise<string[]> {
	const url = wdk.sparqlQuery(query);
	const response = await fetch(url);
	const results = await response.json() as SparqlResults;
	return simplifySparqlResults(results, { minimize: true }) as string[];
}
