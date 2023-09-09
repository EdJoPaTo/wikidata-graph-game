export class Graph {
	#labels = new Map<string, string>();

	#links: Array<[string, string]> = [];

	setLabel(key: string, label: string): void {
		this.#labels.set(key, label);
	}

	addLink(start: string, end: string): void {
		this.#links.push([start, end]);
	}

	build(): string {
		const out: string[] = [
			...[...this.#labels]
				.map(([key, label]) => `${key}: ${label}`),
			...this.#links.map(([a, b]) => `${a} -> ${b}`),
		];
		return out.join("\n") + "\n";
	}
}
