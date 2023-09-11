import {
	isItemId,
	type Item,
	type ItemId,
	type PropertyId,
	type SnakValue,
	type StringSnakValue,
	truthyPropertyClaims,
	type WikibaseEntityIdSnakValue,
} from "https://esm.sh/wikibase-sdk@9.2.2";

const SUBCLASS_OF = "P279";
const PARENT_TAXON = "P171";
const TAXON_NAME = "P225";

export interface SimplifiedItem {
	readonly id: ItemId;
	readonly labels: Readonly<Record<string, string>>;

	readonly taxonName: readonly string[];
	readonly parentTaxon: readonly ItemId[];
	readonly subclassOf: readonly ItemId[];
}

export function simplify(item: Item): SimplifiedItem {
	const id = item.id;

	const labels: Record<string, string> = {};
	for (const [lang, term] of Object.entries(item.labels ?? {})) {
		labels[lang] = term.value;
	}

	return {
		id,
		taxonName: stringSnaks(claimValues(item, TAXON_NAME)),
		parentTaxon: itemSnaks(claimValues(item, PARENT_TAXON)),
		subclassOf: itemSnaks(claimValues(item, SUBCLASS_OF)),
		labels,
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

export function bestEffortLabel(item: SimplifiedItem): string | undefined {
	const taxon = item.taxonName[0];
	const human = item.labels["de"] ?? item.labels["en"];

	if (human && taxon) {
		return human === taxon ? taxon : `${taxon} (${human})`;
	}

	if (taxon) return taxon;
	if (human) return human;
	return undefined;
}
