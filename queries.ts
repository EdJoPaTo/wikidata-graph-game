import type { ItemId } from "https://esm.sh/wikibase-sdk@9.2.4";
import { sparqlQuerySimplifiedMinified } from "./wikidata.ts";

export async function getIndirectParents(itemId: ItemId): Promise<ItemId[]> {
	const query = `SELECT ?parent WHERE {
	BIND (wd:${itemId} as ?item)
	{ ?item (wdt:P279*) ?parent. }
	UNION
	{ ?item (wdt:P171*) ?parent. }
}`;

	const results = await sparqlQuerySimplifiedMinified(query) as ItemId[];
	return results;
}

export async function getDeepSubclassOf(superclass: ItemId): Promise<ItemId[]> {
	const query = `SELECT ?item WHERE {
		?item wdt:P279+ wd:${superclass}.
		FILTER EXISTS {?item wdt:P18 ?image}.
	}`;

	const results = await sparqlQuerySimplifiedMinified(query) as ItemId[];
	return results;
}

export async function getTaxon(taxon: ItemId): Promise<ItemId[]> {
	const query = `SELECT ?item WHERE {
	?item wdt:P105 wd:${taxon}.
	FILTER EXISTS {?item wdt:P225 ?taxonname}.
	FILTER EXISTS {?item wdt:P171 ?taxonparent}.
	FILTER EXISTS {?item wdt:P18 ?image}.
}`;

	const results = await sparqlQuerySimplifiedMinified(query) as ItemId[];
	return results;
}
