import { type ItemId } from "https://esm.sh/wikibase-sdk@9.2.2";
import { bestEffortLabel, getItemParentTaxons } from "./wikidata.ts";
import { getCached } from "./store.ts";

const getParents = (id: ItemId) => getItemParentTaxons(getCached(id)!);

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

	#add(distance: number, item: ItemId) {
		if (this.#items.has(item)) {
			return;
		}

		this.#items.set(item, distance);

		for (const parent of getParents(item)) {
			this.#add(distance + 1, parent);
		}
	}

	getDistance(id: ItemId): number | undefined {
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
					const item = getCached(o)!;
					return `${item.id} ${bestEffortLabel(item)}`;
				}),
			);
		}

		console.log("size", this.#items.size, clone);
	}
}
