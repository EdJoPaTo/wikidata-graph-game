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

export interface SimplifiedItem {
	readonly id: ItemId;
	readonly labels: Readonly<Record<string, string>>;

	readonly images: readonly string[];
	readonly parentTaxon: readonly ItemId[];
	readonly subclassOf: readonly ItemId[];
	readonly taxonName: readonly string[];
}

export function simplify(item: Item): SimplifiedItem {
	const id = item.id;

	const labels: Record<string, string> = {};
	for (const [lang, term] of Object.entries(item.labels ?? {})) {
		labels[lang] = term.value;
	}

	return {
		id,
		images: stringSnaks(claimValues(item, "P18")),
		parentTaxon: itemSnaks(claimValues(item, "P171")),
		subclassOf: itemSnaks(claimValues(item, "P279")),
		taxonName: stringSnaks(claimValues(item, "P225")),
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
