import {
	isItemId,
	type Item,
	type ItemId,
	type PropertyId,
	type SnakValue,
	type StringSnakValue,
	type Term,
	truthyPropertyClaims,
	type WikibaseEntityIdSnakValue,
} from "https://esm.sh/wikibase-sdk@9.2.2";

export interface SimplifiedItem {
	readonly timestamp: number;
	readonly labels: Readonly<Record<string, string>>;
	readonly descriptions: Readonly<Record<string, string>>;

	readonly images: readonly string[];
	readonly parentTaxon: readonly ItemId[];
	readonly subclassOf: readonly ItemId[];
	readonly taxonName: readonly string[];
}

function flatTerms(terms: Record<string, Term>): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [lang, term] of Object.entries(terms)) {
		result[lang] = term.value;
	}

	return result;
}

export function simplify(item: Item): SimplifiedItem {
	return {
		timestamp: Date.now(),
		images: stringSnaks(claimValues(item, "P18")),
		parentTaxon: itemSnaks(claimValues(item, "P171")),
		subclassOf: itemSnaks(claimValues(item, "P279")),
		taxonName: stringSnaks(claimValues(item, "P225")),
		labels: flatTerms(item.labels ?? {}),
		descriptions: flatTerms(item.descriptions ?? {}),
	};
}

function claimValues(item: Item, claim: PropertyId): SnakValue[] {
	const c = item.claims?.[claim];
	if (!c) return [];
	const truthy = truthyPropertyClaims(c);
	return truthy
		.map((o) => o.mainsnak.datavalue)
		.filter((o): o is SnakValue => Boolean(o));
}

function stringSnaks(values: readonly SnakValue[]): string[] {
	return values
		.filter((o): o is StringSnakValue => o.type === "string")
		.map((o) => o.value);
}

function itemSnaks(values: readonly SnakValue[]): ItemId[] {
	return values
		.filter((o): o is WikibaseEntityIdSnakValue =>
			o.type === "wikibase-entityid"
		)
		.map((o) => o.value.id)
		.filter((o): o is ItemId => isItemId(o));
}

export function getItemParents(item: SimplifiedItem): readonly ItemId[] {
	return item.parentTaxon.length > 0 ? item.parentTaxon : item.subclassOf;
}

export function shortLang(language: string): string {
	return language.split(/-_/)[0]!;
}

/** Use en when en-US is not there */
function bestEffortTerm(
	terms: Record<string, string>,
	language: string,
): string | undefined {
	return terms[language] || terms[shortLang(language)];
}

export function bestEffortLabel(
	item: SimplifiedItem,
	language: string,
): string | undefined {
	const taxon = item.taxonName[0];
	const human = bestEffortTerm(item.labels, language);

	if (human && taxon) {
		return human === taxon ? taxon : `${taxon} (${human})`;
	}

	if (taxon) return taxon;
	if (human) return human;
	return undefined;
}

export function bestEffortDescription(
	item: SimplifiedItem,
	language: string,
): string | undefined {
	return bestEffortTerm(item.descriptions, language);
}
