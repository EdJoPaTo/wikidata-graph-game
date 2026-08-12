export function randomItem<T>(list: readonly T[]): T {
	if (list.length === 0) throw new Error("empty array");
	const index = Math.floor(Math.random() * list.length);
	return list[index]!;
}

export function unreachable(unreachable: never): never {
	throw new Error(
		"Should have been unreachable but looks like it wasnt: " +
			JSON.stringify(unreachable),
	);
}
