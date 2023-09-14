type Links<T> = ReadonlyArray<readonly [T, T]>;

function neighbors<T>(links: Links<T>, item: T): T[] {
	const result = new Set<T>();
	for (const [a, b] of links) {
		if (a === b) continue;
		if (a === item) result.add(b);
		if (b === item) result.add(a);
	}
	return [...result];
}

export function dijkstra<T>(
	links: Links<T>,
	start: T,
): Map<T, readonly T[]> {
	const solutions = new Map<T, readonly T[]>();
	solutions.set(start, [start]);

	const bordernodes = new Set([start]);

	while (bordernodes.size > 0) {
		for (const known of bordernodes) {
			const path = solutions.get(known)!;
			for (const node of neighbors(links, known)) {
				if (solutions.has(node)) continue;
				solutions.set(node, [...path, node]);
				bordernodes.add(node);
			}
			bordernodes.delete(known);
		}
	}

	return solutions;
}

export function getClosestParents<T>(
	links: Links<T>,
	start: T,
	targets: readonly T[],
): [number, T[]] {
	const reached = new Set<T>();
	reached.add(start);

	const bordernodes = new Set([start]);
	const closest = new Set<T>();
	let distance = 1;

	while (bordernodes.size > 0) {
		for (const known of [...bordernodes]) {
			const parents = links
				.filter(([_start, end]) => known === end)
				.map(([start]) => start);
			for (const node of parents) {
				if (reached.has(node)) continue;
				if (targets.includes(node)) closest.add(node);
				reached.add(node);
				bordernodes.add(node);
			}
			bordernodes.delete(known);
		}

		if (closest.size > 0) return [distance, [...closest]];
		distance++;
	}

	return [Number.POSITIVE_INFINITY, []];
}

export function getParentsCloserThanDistance<T>(
	links: Links<T>,
	start: T,
	maxDistance: number,
): T[] {
	const reached = new Set<T>();
	reached.add(start);

	let bordernodes = new Set([start]);
	let distance = 1;

	while (bordernodes.size > 0) {
		if (distance >= maxDistance) return [...bordernodes];
		const next = new Set<T>();

		for (const known of bordernodes) {
			const parents = links
				.filter(([_start, end]) => known === end)
				.map(([start]) => start);
			for (const node of parents) {
				if (reached.has(node)) continue;
				reached.add(node);
				next.add(node);
			}
		}

		if (next.size === 0) return [...bordernodes];
		bordernodes = next;
		distance++;
	}

	return [...bordernodes];
}
