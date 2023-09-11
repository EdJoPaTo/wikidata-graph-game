export function randomItem<T>(list: readonly T[]): T {
	if (list.length === 0) throw new Error("empty array");
	const index = Math.floor(Math.random() * list.length);
	return list[index]!;
}
