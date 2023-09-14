import type { ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { getCached } from "./store.ts";
import { bestEffortLabel, getItemParents } from "./simplify-item.ts";

export class Parents<T> {
	readonly #items: Map<T, number>;
	readonly #distances = new Map<number, T[]>();

	constructor(items: Map<T, number>) {
		this.#items = items;

		for (const [item, distance] of this.#items) {
			const onDistance = this.#distances.get(distance) ?? [];
			onDistance.push(item);
			this.#distances.set(distance, onDistance);
		}
	}

	getRoot(): readonly T[] {
		const max = Math.max(...this.#distances.keys());
		return this.#distances.get(max) ?? [];
	}

	getOnDistance(distance: number): readonly T[] {
		return this.#distances.get(distance) ?? [];
	}

	getDistanceTo(id: T): number | undefined {
		return this.#items.get(id);
	}

	getMinimumDistance(ids: readonly T[]): T[] {
		let minimumDistance = Number.POSITIVE_INFINITY;
		let minimumItems: T[] = [];

		for (const id of ids) {
			const distance = this.#items.get(id);
			if (distance === undefined) {
				continue;
			}

			if (distance < minimumDistance) {
				minimumDistance = distance;
				minimumItems = [id];
			} else if (distance === minimumDistance) {
				minimumItems.push(id);
			}
		}

		return minimumItems;
	}

	getCommon(other: Parents<T>): T[] {
		return [...other.#items.keys()].filter((o) => this.#items.has(o));
	}

	getCommonMinimumDistance(other: Parents<T>): T[] {
		return this.getMinimumDistance(this.getCommon(other));
	}

	static debug(p: Parents<ItemId>): void {
		const clone = new Map<number, string[]>();

		for (const [depth, values] of p.#distances) {
			clone.set(
				depth,
				values.map((id) => {
					const item = getCached(id);
					return `${id} ${bestEffortLabel(item, "de")}`;
				}),
			);
		}

		console.log("size", p.#items.size, clone);
	}

	static fromChild<T>(
		childId: T,
		getDirectParents: (id: T) => readonly T[],
	): Parents<T> {
		function add(distance: number, id: T) {
			if (map.has(id)) {
				return;
			}

			map.set(id, distance);

			for (const parent of getDirectParents(id)) {
				add(distance + 1, parent);
			}
		}

		const map = new Map();
		add(0, childId);
		return new Parents(map);
	}

	static fromItemCache(childId: ItemId): Parents<ItemId> {
		return this.fromChild(childId, (id) => getItemParents(getCached(id)));
	}
}
