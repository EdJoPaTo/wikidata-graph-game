import type { ItemId } from "https://esm.sh/wikibase-sdk@9.2.4";
import { randomItem, unreachable } from "./helpers.ts";
import { getDeepSubclassOf, getTaxon } from "./queries.ts";

export type TargetKind = "taxon" | "class";

export const TARGET_GROUPS = [
	["taxon", "Q2136103"], // Superfamily
	["taxon", "Q35409"], // Family
	["taxon", "Q164280"], // Subfamily
	["taxon", "Q34740"], // Gattung
	["class", "Q11422"], // toy
	["class", "Q11460"], // clothing
	["class", "Q2095"], // Food
	["class", "Q28877"], // goods
	["class", "Q327055"], // worker
	["class", "Q34379"], // Musical instrument
	["class", "Q42889"], // Vehicle
	["class", "Q712378"], // Organ
	["class", "Q7946"], // mineral
] as const satisfies ReadonlyArray<readonly [TargetKind, ItemId]>;

export async function getTarget(
	kind: TargetKind,
	id: ItemId,
): Promise<ItemId> {
	if (kind === "taxon") {
		return randomItem(await getTaxon(id));
	}

	if (kind === "class") {
		return randomItem(await getDeepSubclassOf(id));
	}

	unreachable(kind);
}
