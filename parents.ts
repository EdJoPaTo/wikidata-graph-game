import { type ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { getCached } from "./store.ts";
import { bestEffortLabel, getItemParents } from "./simplify-item.ts";

export class Parents {
	#items = new Map<ItemId, number>();
	#distances = new Map<number, ItemId[]>();

	constructor(id: ItemId) {
		this.#add(0, id);

		for (const [item, distance] of this.#items) {
			const onDistance = this.#distances.get(distance) ?? [];
			onDistance.push(item);
			this.#distances.set(distance, onDistance);
		}
	}

	#add(distance: number, id: ItemId) {
		if (this.#items.has(id)) {
			return;
		}

		this.#items.set(id, distance);

		const item = getCached(id);
		for (const parent of getItemParents(item)) {
			this.#add(distance + 1, parent);
		}
	}

	getOnDistance(distance: number): ItemId[] {
		return this.#distances.get(distance) ?? [];
	}

	getDistanceTo(id: ItemId): number | undefined {
		return this.#items.get(id);
	}

	getMinimumDistance(ids: ItemId[]): ItemId[] {
		let hitDistance = Number.POSITIVE_INFINITY;
		let hits: ItemId[] = [];

		for (const item of ids) {
			const hit = this.#items.get(item);
			if (hit === undefined) {
				continue;
			}

			if (hit < hitDistance) {
				hitDistance = hit;
				hits = [item];
			} else if (hit === hitDistance) {
				hits.push(item);
			}
		}

		return hits;
	}

	getCommon(other: Parents): ItemId[] {
		return [...other.#items.keys()].filter((o) => this.#items.has(o));
	}

	getCommonMinimumDistance(other: Parents): ItemId[] {
		return this.getMinimumDistance(this.getCommon(other));
	}

	debug(): void {
		const clone = new Map<number, string[]>();

		for (const [depth, values] of this.#distances) {
			clone.set(
				depth,
				values.map((o) => {
					const item = getCached(o);
					return `${item.id} ${bestEffortLabel(item)}`;
				}),
			);
		}

		console.log("size", this.#items.size, clone);
	}
}
