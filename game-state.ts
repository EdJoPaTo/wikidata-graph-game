import type { ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { getClosestParents, getParentsCloserThanDistance } from "./dijkstra.ts";
import { Graph } from "./graph.ts";
import { getInterestingNodes } from "./parent-graph.ts";
import { getIndirectParents } from "./queries.ts";
import { bestEffortLabel, getItemParents } from "./simplify-item.ts";
import * as store from "./store.ts";

export class GameState {
	public readonly guesses = new Set<ItemId>();

	constructor(
		public readonly target: ItemId,
	) {}

	addGuess(guess: ItemId): void {
		this.guesses.add(guess);
	}

	isWon(): boolean {
		return this.guesses.has(this.target);
	}

	hasMissingWikidataLabels(language: string): boolean {
		const links = this.getAllParentLinks();
		const nodes = new Set<ItemId>([
			this.target,
			...this.guesses,
			...getInterestingNodes(links, this.target, [...this.guesses]),
		]);
		if (!this.isWon()) nodes.delete(this.target);

		return [...nodes].some((id) =>
			bestEffortLabel(store.getCached(id), language) === undefined
		);
	}

	async cache(): Promise<void> {
		await cacheWithParents([this.target, ...this.guesses]);
	}

	getAllParentLinks(): [ItemId, ItemId][] {
		function add(id: ItemId) {
			if (all.has(id)) {
				return;
			}

			all.add(id);

			for (const parent of getItemParents(store.getCached(id))) {
				list.push([parent, id]);
				add(parent);
			}
		}

		const all = new Set<ItemId>();
		const list: Array<[ItemId, ItemId]> = [];

		for (const id of [this.target, ...this.guesses]) {
			add(id);
		}

		return list;
	}

	hints(): ItemId[] {
		if (this.isWon()) return [];
		const links = this.getAllParentLinks();
		const interesting = getInterestingNodes(links, this.target, [
			...this.guesses,
		]);
		const [distance] = getClosestParents(links, this.target, [
			...interesting,
			...this.guesses,
		]);
		return getParentsCloserThanDistance(links, this.target, distance);
	}

	graph(language: string): Graph {
		const links = this.getAllParentLinks();
		const graph = new Graph();
		const nodes = new Set<ItemId>([
			this.target,
			...this.guesses,
			...getInterestingNodes(links, this.target, [...this.guesses]),
		]);
		for (const id of nodes) {
			const item = store.getCached(id);
			graph.setLabel(id, bestEffortLabel(item, language));

			const [distance, parents] = getClosestParents(
				links,
				id,
				[...nodes].filter((o) => o !== id),
			);
			for (const parent of parents) {
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
				? bestEffortLabel(store.getCached(this.target), language)
				: "guess me",
		);

		return graph;
	}
}

function findUncachedParents(
	state: Map<ItemId, "missing" | "existing">,
	ids: readonly ItemId[],
): void {
	const remaining = new Set<ItemId>();
	for (const id of ids) {
		if (state.has(id)) continue;
		const item = store.tryGet(id);
		if (item) {
			state.set(id, "existing");
			for (const parent of getItemParents(item)) {
				remaining.add(parent);
			}
		} else {
			state.set(id, "missing");
		}
	}
	if (remaining.size > 0) {
		findUncachedParents(state, [...remaining]);
	}
}

async function cacheWithParents(ids: readonly ItemId[]): Promise<void> {
	const map = new Map<ItemId, "missing" | "existing">();
	findUncachedParents(map, ids);

	const missing = [...map]
		.filter(([_id, state]) => state === "missing")
		.map(([id]) => id);

	if (missing.length > 0) {
		const parents = await Promise.all(
			missing.map((id) => getIndirectParents(id)),
		);
		missing.push(...parents.flat());

		const updated = await store.cache(missing);
		await cacheWithParents(updated);
	}
}
