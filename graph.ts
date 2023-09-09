export class Graph {
	#labels = new Map<string, string>();

	#links = new Map<string, string[]>();

	setLabel(key: string, label: string | undefined): void {
		if (label) {
			this.#labels.set(key, label);
		}
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
			...[...this.#links]
				.flatMap(([start, ends]) => ends.map((end) => `${start} -> ${end}`)),
		];
		return out.join("\n") + "\n";
	}
}
