export class Graph {
	#labels = new Map<string, string>();
	#shapes = new Map<string, string>();

	#links = new Map<string, string[]>();

	setLabel(key: string, label: string | undefined): void {
		if (label) {
			this.#labels.set(key, label);
		}
	}

	setShape(key: string, shape: string): void {
		this.#shapes.set(key, shape);
	}

	addLink(start: string, end: string): void {
		const onStart = this.#links.get(start) ?? [];
		if (onStart.includes(end)) {
			return;
		}

		onStart.push(end);
		this.#links.set(start, onStart);
	}

	build(): string {
		const out: string[] = [
			...[...this.#labels]
				.map(([key, label]) => `${key}: ${label}`),
			...[...this.#shapes]
				.map(([key, label]) => `${key}.shape: ${label}`),
			...[...this.#links]
				.flatMap(([start, ends]) => ends.map((end) => `${start} -> ${end}`)),
		];
		return out.join("\n") + "\n";
	}
}
