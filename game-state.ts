import type { ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { bestEffortLabel, getItemParents } from "./simplify-item.ts";
import { getIndirectParents } from "./queries.ts";
import { Graph } from "./graph.ts";
import { Parents } from "./parents.ts";
import * as store from "./store.ts";

export class GameState {
	public readonly guesses = new Set<ItemId>();

	constructor(
		public readonly target: ItemId,
	) {}

	addGuess(guess: ItemId): void {
		this.guesses.add(guess);
	}

	async cache(): Promise<void> {
		await cacheWithParents([this.target, ...this.guesses]);
	}

	interestingNodes(): ItemId[] {
		const known = [this.target, ...this.guesses];
		const interesting = new Set<ItemId>();
		for (const aId of known) {
			const aParents = new Parents(aId);
			for (const bId of known) {
				if (aId === bId) continue;
				const bParents = new Parents(bId);
				const commonParents = aParents.getCommonMinimumDistance(bParents);
				for (const parent of commonParents) {
					interesting.add(parent);
				}
			}
		}
		return [...interesting];
	}

	hints(): ItemId[] {
		const targetParents = new Parents(this.target);
		const interesting = this.interestingNodes();
		const closestKnown = targetParents.getMinimumDistance(interesting);
		if (closestKnown.length === 0) return [];
		const distance = targetParents.getDistanceTo(closestKnown[0]!);
		if (distance === undefined) return [];
		const closer = targetParents.getOnDistance(distance - 1);
		return closer;
	}

	graph(): Graph {
		const graph = new Graph();
		const nodes = new Set<ItemId>([
			this.target,
			...this.guesses,
			...this.interestingNodes(),
		]);
		for (const id of nodes) {
			const item = store.getCached(id);
			graph.setLabel(id, bestEffortLabel(item));

			const idParents = new Parents(id);

			const parents = idParents.getMinimumDistance(
				[...nodes].filter((o) => o !== id),
			);
			for (const parent of parents) {
				const distance = idParents.getDistanceTo(parent);
				graph.addLink(parent, id, `${distance}`);
			}
		}

		for (const id of this.guesses) {
			graph.setShape(id, "guess");
		}

		graph.setShape(this.target, "target");
		graph.setLabel(
			this.target,
			this.guesses.has(this.target)
				? bestEffortLabel(store.getCached(this.target))
				: "guess me",
		);

		return graph;
	}
}

function findUncachedParents(id: ItemId): ItemId[] {
	const item = store.tryGet(id);
	if (!item) return [id];
	const parents = getItemParents(item);
	return parents.flatMap((parent) => findUncachedParents(parent));
}

async function cacheWithParents(ids: readonly ItemId[]): Promise<void> {
	let missing: ItemId[] = [];
	while ((missing = ids.flatMap((id) => findUncachedParents(id))).length > 0) {
		// deno-lint-ignore no-await-in-loop
		const parents = await Promise.all(
			missing.map((id) => getIndirectParents(id)),
		);
		missing.push(...parents.flat());

		// deno-lint-ignore no-await-in-loop
		await store.cache(missing);
	}
}
