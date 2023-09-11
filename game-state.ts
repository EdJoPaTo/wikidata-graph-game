import type { ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { bestEffortLabel, getItemParents } from "./simplify-item.ts";
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

	graph(): Graph {
		const graph = new Graph();
		const interesting = new Set<ItemId>([this.target, ...this.guesses]);

		for (const aId of interesting) {
			const aParents = new Parents(aId);
			for (const bId of interesting) {
				if (aId === bId) continue;
				const bParents = new Parents(bId);
				const commonParents = aParents.getCommonMinimumDistance(bParents);
				for (const parent of commonParents) {
					interesting.add(parent);
				}
			}
		}

		for (const id of interesting) {
			const item = store.getCached(id);
			graph.setLabel(id, bestEffortLabel(item));

			const idParents = new Parents(id);

			const parents = idParents.getMinimumDistance(
				[...interesting].filter((o) => o !== id),
			);
			for (const parent of parents) {
				const distance = idParents.getDistance(parent);
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

async function cacheWithParents(ids: ItemId[]): Promise<void> {
	await store.cache(ids);
	const next: ItemId[] = [];
	for (const id of ids) {
		const parents = getItemParents(store.getCached(id));
		next.push(...parents);
	}
	if (next.length > 0) {
		await cacheWithParents(next);
	}
}
